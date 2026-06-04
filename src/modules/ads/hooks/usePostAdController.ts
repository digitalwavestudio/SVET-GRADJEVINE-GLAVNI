import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getAuth } from 'firebase/auth';
import { collection, doc } from 'firebase/firestore';
import { db } from '@/src/firebase-db';
import { useToast } from '@/src/context/ToastContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/src/context/AuthContext';
import { uploadImageDirectly } from '@/src/lib/imageCompressor';
import { moderationService } from '@/src/services/moderationService';
import { apiClient } from '@/src/lib/apiClient';
import { traceAsync } from '@/src/lib/performance';
import { MAX_AD_IMAGES } from '@/src/constants/limits';
import { dashboardKeys } from '@/src/lib/queryKeysFactory';

import { getValidationSchema, getAutoTitle } from '@/src/modules/ads/utils/adUtils';
import { applyPayloadTransform } from '@/src/modules/ads/hooks/usePostAdControllerPayload';
import { usePostAdStore } from '@/src/modules/ads/stores/usePostAdStore';

const COOLDOWN_SECONDS = 60;
const LAST_POST_KEY = 'svet_gradjevine_last_post_time';

interface UsePostAdControllerProps {
  initialPackage: string;
  editId?: string | null;
  editType?: string | null;
  editFlag?: string | null;
  launchMode?: boolean;
}

export function usePostAdController({ initialPackage, editId, editType, editFlag, launchMode }: UsePostAdControllerProps) {
  const { showSuccess, showError } = useToast();
  const { user } = useAuth();
  
  const selectedCategory = usePostAdStore((state) => state.selectedCategory);
  const setSelectedCategory = usePostAdStore((state) => state.setSelectedCategory);
  const step = usePostAdStore((state) => state.step);
  const setStep = usePostAdStore((state) => state.setStep);
  const formDataStore = usePostAdStore((state) => state.formData);
  const setFormDataStore = usePostAdStore((state) => state.setFormData);
  const resetFormStore = usePostAdStore((state) => state.resetForm);

  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const queryClient = useQueryClient();
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [createdAdId, setCreatedAdId] = useState<string | null>(null);
  const [paymentTab, setPaymentTab] = useState<'uplatnica' | 'faktura'>('uplatnica');
  const [editItem, setEditItem] = useState<AdItemData | null>(null);
  const [showDepositPrompt, setShowDepositPrompt] = useState(false);
  const [missingAmount, setMissingAmount] = useState(0);
  
  // Predictable ID for new ads to allow parallel image processing
  const [adId] = useState(() => {
    if (editId) return editId;
    return doc(collection(db, 'listings')).id;
  });

  // Stable fallback reference number for the session
  const [sessionRefId] = useState(() => Math.floor(Math.random() * 900000 + 100000).toString());


  const editItemFetchedRef = useRef(false);
  const hasPopulatedEditRef = useRef(false);
  const pendingFilesRef = useRef<{ [key: string]: File }>({});

interface UserAttributes {
  id: string;
  uid: string;
  email: string | null;
  role: string | undefined;
  companyId?: string;
  company?: string;
  companyLogo?: string;
  isVerified?: boolean;
  name?: string;
  firstName?: string;
  lastName?: string;
}

interface PlotData {
  id: string;
  location?: string;
  locationSlug?: string;
  address?: string;
  description?: string;
  contact?: { phone?: string; email?: string };
  images?: string[];
  isPremium?: boolean;
  isUrgent?: boolean;
  area?: number | string;
  areaUnit?: 'ari' | 'ha';
  price?: number | string;
  currency?: string;
  purpose?: string;
  infrastructure?: {
    electricity?: boolean;
    water?: boolean;
    sewer?: boolean;
    gas?: boolean;
    internet?: boolean;
  };
  accessRoad?: string;
  cadastralNumber?: string;
  cadastralMunicipality?: string;
  occupancy?: number | string;
  buildabilityIndex?: number | string;
  maxFloors?: number | string;
  notes?: string;
  docs?: { label: string; url: string }[];
  heating?: boolean;
  telephone?: boolean;
  technicalWater?: boolean;
  drinkingWater?: boolean;
  railAccess?: boolean;
  highwayAccess?: boolean;
  airportAccess?: boolean;
  plannedPurpose?: string;
  minParcelSize?: number | string;
  maxParcelSize?: number | string;
  buildingHeight?: number | string;
  parkingStandard?: string;
  productionParkingStandard?: string;
  parcelNumbers?: string;
  municipalityName?: string;
  populationEstimate?: number | string;
  averageSalary?: number | string;
  marketValueEstimate?: string;
  developmentFeeBusiness?: string;
  developmentFeeResidential?: string;
  freeZone?: boolean;
  greenEnergySuitable?: boolean;
}

interface MachineData {
  id: string;
  manufacturer?: string;
  modelstr?: string;
  categoryId?: string;
  subcategoryId?: string;
  year?: string | number;
  powerKw?: string | number;
  workingHours?: string | number;
  fuelType?: string;
  adType?: 'prodaja' | 'iznajmljivanje';
  price?: string | number;
  pricePerDay?: string | number;
  operatorIncluded?: boolean;
  weightKg?: string | number;
  lengthMm?: string | number;
  widthMm?: string | number;
  heightMm?: string | number;
  loadCapacityKg?: string | number;
  bucketCapacityM3?: string | number;
  maxDigDepthMm?: string | number;
  maxReachMm?: string | number;
  serviceHistory?: string;
  videoUrl?: string;
  locationSlug?: string;
  phone?: string;
  whatsapp?: boolean;
  images?: string[];
  isPremium?: boolean;
  isUrgent?: boolean;
}

interface CompanyData {
  id: string;
  name?: string;
  pib?: string;
  address?: string;
  locationSlug?: string;
  phone?: string;
  workingHours?: string;
  description?: string;
  mainCategories?: string[];
  subCategories?: string[];
  coverageType?: 'regional' | 'national' | 'international' | 'local';
  coverageValue?: string;
  instagram?: string;
  facebook?: string;
  website?: string;
  logo?: string;
  images?: string[];
  employeeCount?: string;
  portfolioImages?: string[];
  references?: string[];
  licenses?: string[];
  certifications?: string[];
  equipmentSummary?: string;
  teamSpecialties?: string[];
  isPremium?: boolean;
  isUrgent?: boolean;
}

interface AccommodationData {
  id: string;
  typeSlug?: string;
  locationSlug?: string;
  totalBeds?: number | string;
  availableBeds?: number | string;
  price?: number | string;
  priceType?: 'perPerson' | 'perNight';
  amenities?: string[];
  description?: string;
  images?: string[];
  isPremium?: boolean;
  isUrgent?: boolean;
  distanceToSiteKm?: number | string;
  parkingAvailable?: boolean;
  truckAccess?: boolean;
  laundryAvailable?: boolean;
  kitchenAvailable?: boolean;
  wifiAvailable?: boolean;
  airConditioning?: boolean;
  invoiceAvailable?: boolean;
  minStayDays?: number | string;
  contactPhone?: string;
}

interface CateringData {
  id: string;
  title?: string;
  kitchenType?: string;
  locationSlug?: string;
  tacnaLokacija?: string;
  minOrder?: number | string;
  pricePerMeal?: string | number;
  deliveryZone?: string;
  amenities?: string[];
  description?: string;
  telefon?: string;
  contactPhone?: string;
  images?: string[];
  isPremium?: boolean;
  isUrgent?: boolean;
  invoiceAvailable?: boolean;
  haccpCertified?: boolean;
  packagingIncluded?: boolean;
  dailyCapacityMeals?: number | string;
  menuItems?: string[];
}

interface JobData {
  id: string;
  sectorSlug?: string;
  professionSlug?: string;
  locationSlug?: string;
  sal?: number | string;
  salary?: number | string;
  experienceSlug?: string;
  engagementSlug?: string;
  benefits?: string[];
  description?: string;
  telefon?: string;
  phone?: string;
  isPremium?: boolean;
}

interface MarketplaceData {
  id: string;
  title?: string;
  marketCategory?: string;
  marketCondition?: 'new' | 'used';
  price?: number | string;
  locationSlug?: string;
  address?: string;
  description?: string;
  images?: string[];
  phone?: string;
  telefon?: string;
  isPremium?: boolean;
  isUrgent?: boolean;
}

type AdItemData = PlotData | MachineData | CompanyData | AccommodationData | CateringData | JobData | MarketplaceData;

interface AdFormData {
  location: string;
  tacnaLokacija: string;
  opis: string;
  phone: string;
  email: string;
  viber: boolean;
  whatsapp: boolean;
  images: (string | File)[];
  paket: string;
  sector: string;
  profession: string;
  companyMainCats: string[];
  companySubCats: string[];
  benefiti: string[];
  amenities: string[];
  plotDocs: { label: string; url: string }[];
  companyPortfolioImages?: (string | File)[];
  plotInfrastructure?: Record<string, boolean>;
  [key: string]: string | boolean | string[] | (string | File)[] | { label: string; url: string }[] | Record<string, boolean> | undefined | null | number;
}

  const methods = useForm<AdFormData>({
    defaultValues: {
      location: '',
      tacnaLokacija: '',
      opis: '',
      phone: '',
      email: '',
      viber: false,
      whatsapp: false,
      images: [],
      paket: initialPackage,
      sector: '',
      profession: '',
      companyMainCats: [],
      companySubCats: [],
      benefiti: [],
      amenities: [],
      plotDocs: [{ label: '', url: '' }],
      plotInfrastructure: {
        struja: false,
        voda: false,
        kanalizacija: false,
        gas: false,
        optika: false,
      },
      ...formDataStore
    },
    resolver: async (values, context, options) => {
      const schema = getValidationSchema(selectedCategory);
      if (schema) {
        return (zodResolver(schema) as any as import('react-hook-form').Resolver<AdFormData>)(values, context, options);
      }
      return { values: values, errors: {} } as import('react-hook-form').ResolverResult<AdFormData>;
    },
    mode: 'onSubmit'
  });

  const { trigger, reset, watch, setValue, getValues, handleSubmit: rhfHandleSubmit } = methods;
  const formData = watch();

  useEffect(() => {
    // Sync to Zustand
    const subscription = methods.watch((value) => {
      setFormDataStore(value as AdFormData);
    });
    return () => subscription.unsubscribe();
  }, [methods.watch, setFormDataStore]);

  useEffect(() => {
    if (!editId) {
      const draft = localStorage.getItem('postAdDraft');
      if (draft) {
        try {
          setShowDraftPrompt(true);
        } catch (e) {
          localStorage.removeItem('postAdDraft');
        }
      }
    }
  }, [editId]);

  useEffect(() => {
    if (!showDraftPrompt && !editId && formData) {
      const timer = setTimeout(() => {
        localStorage.setItem('postAdDraft', JSON.stringify({ category: selectedCategory, step, formData }));
      }, 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [formData, selectedCategory, step, showDraftPrompt, editId]);

  useEffect(() => {
    const lastPost = localStorage.getItem(LAST_POST_KEY);
    if (lastPost) {
      const elapsed = Math.floor((Date.now() - parseInt(lastPost)) / 1000);
      if (elapsed < COOLDOWN_SECONDS) {
        setCooldown(COOLDOWN_SECONDS - elapsed);
        const timer = setInterval(() => {
          setCooldown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        return () => clearInterval(timer);
      }
    }
    return undefined;
  }, []);

  useEffect(() => {
    if (editId && editType && !editItemFetchedRef.current) {
      const fetchEditItem = async () => {
        try {
          const data = await apiClient.get<AdItemData>(`/ads/${editId}`);
          if (data) {
            setEditItem(data);
            editItemFetchedRef.current = true;
          }
        } catch (error) {
          console.error("Error fetching edit item:", error);
        }
      };
      fetchEditItem();
    }
  }, [editId, editType]);

  useEffect(() => {
    if (hasPopulatedEditRef.current || !editItem) return;
    
    // Virtual arrays to mock previously used context lists
    const mockPlots = editType === 'plac' || editType === 'placevi' ? [editItem] : [];
    const mockMachines = editType === 'masine' || editType === 'machine' || editType === 'gradjevinske-masine' ? [editItem] : [];
    const mockCompanies = editType === 'company' || editType === 'firma' || editType === 'poslodavac' ? [editItem] : [];
    const mockAccommodations = editType === 'accommodation' || editType === 'smeštaj' ? [editItem] : [];
    const mockCaterings = editType === 'catering' || editType === 'ketering' ? [editItem] : [];
    const mockJobs = editType === 'job' || editType === 'posao' ? [editItem] : [];

    if (editFlag === 'true' && editId && editItem) {
      const item = editItem;
      if (editType === 'plac' || editType === 'placevi') {
        const plotToEdit = item as PlotData;
        if (plotToEdit && plotToEdit.id === editId) {
          setSelectedCategory('plot');
          hasPopulatedEditRef.current = true;
          reset({
            ...methods.getValues(),
            location: plotToEdit.location || '',
            tacnaLokacija: plotToEdit.address || '',
            opis: plotToEdit.description || '',
            phone: plotToEdit.contact?.phone || '',
            email: plotToEdit.contact?.email || '',
            images: plotToEdit.images || [],
            paket: plotToEdit.isPremium ? 'premium' : (plotToEdit.isUrgent ? 'urgent' : 'free'),
            plotArea: plotToEdit.area?.toString() || '',
            plotAreaUnit: (plotToEdit.areaUnit === 'ha' ? 'ha' : 'ari') as 'ari' | 'ha',
            plotPrice: plotToEdit.price?.toString() || '',
            plotCurrency: plotToEdit.currency || 'EUR',
            plotPurpose: plotToEdit.purpose || 'građevinsko',
            plotInfrastructure: { 
              struja: !!(plotToEdit.infrastructure as { electricity?: boolean })?.electricity,
              voda: !!(plotToEdit.infrastructure as { water?: boolean })?.water,
              kanalizacija: !!(plotToEdit.infrastructure as { sewer?: boolean })?.sewer,
              gas: !!(plotToEdit.infrastructure as { gas?: boolean })?.gas,
              optika: !!(plotToEdit.infrastructure as { internet?: boolean })?.internet 
            },
            plotAccessRoad: (plotToEdit.accessRoad === 'tucanik' ? 'tucanik' : (plotToEdit.accessRoad === 'zemlja' ? 'zemljani' : 'asfalt')) as 'asfalt' | 'tucanik' | 'zemljani',
            plotCadastralNumber: plotToEdit.cadastralNumber || '',
            plotCadastralMunicipality: plotToEdit.cadastralMunicipality || '',
            plotOccupancy: plotToEdit.occupancy?.toString() || '',
            plotBuildabilityIndex: plotToEdit.buildabilityIndex?.toString() || '',
            plotMaxFloors: plotToEdit.maxFloors?.toString() || '',
            plotNotes: plotToEdit.notes || '',
            plotDocs: plotToEdit.docs?.length ? plotToEdit.docs : [{ label: '', url: '' }],
            plotHeating: plotToEdit.heating || false,
            plotTelephone: plotToEdit.telephone || false,
            plotTechnicalWater: plotToEdit.technicalWater || false,
            plotDrinkingWater: plotToEdit.drinkingWater || false,
            plotRailAccess: plotToEdit.railAccess || false,
            plotHighwayAccess: plotToEdit.highwayAccess || false,
            plotAirportAccess: plotToEdit.airportAccess || false,
            plotPlannedPurpose: plotToEdit.plannedPurpose || '',
            plotMinParcelSize: plotToEdit.minParcelSize?.toString() || '',
            plotMaxParcelSize: plotToEdit.maxParcelSize?.toString() || '',
            plotBuildingHeight: plotToEdit.buildingHeight?.toString() || '',
            plotParkingStandard: plotToEdit.parkingStandard || '',
            plotProductionParkingStandard: plotToEdit.productionParkingStandard || '',
            plotParcelNumbers: plotToEdit.parcelNumbers || '',
            plotMunicipalityName: plotToEdit.municipalityName || '',
            plotPopulationEstimate: plotToEdit.populationEstimate?.toString() || '',
            plotAverageSalary: plotToEdit.averageSalary?.toString() || '',
            plotMarketValueEstimate: plotToEdit.marketValueEstimate || '',
            plotDevelopmentFeeBusiness: plotToEdit.developmentFeeBusiness || '',
            plotDevelopmentFeeResidential: plotToEdit.developmentFeeResidential || '',
            plotFreeZone: plotToEdit.freeZone || false,
            plotGreenEnergySuitable: plotToEdit.greenEnergySuitable || false
          });
        }
      } else if (editType === 'masine' || editType === 'machine' || editType === 'gradjevinske-masine') {
        const machineToEdit = item as any as MachineData;
        if (machineToEdit && machineToEdit.id === editId) {
          setSelectedCategory('machines');
          hasPopulatedEditRef.current = true;
          reset({
            ...getValues(),
            machBrand: machineToEdit.manufacturer || '',
            machModel: machineToEdit.modelstr || '',
            machCategory: machineToEdit.categoryId || '',
            machSubCategory: machineToEdit.subcategoryId || '',
            machYear: machineToEdit.year || '',
            machPower: machineToEdit.powerKw || '',
            machHours: machineToEdit.workingHours || '',
            machFuel: machineToEdit.fuelType || '',
            machAdType: (machineToEdit.adType === 'iznajmljivanje' ? 'iznajmljivanje' : 'prodaja') as 'prodaja' | 'iznajmljivanje',
            machPrice: machineToEdit.price !== 'Na upit' ? machineToEdit.price : '',
            machPricePerDay: machineToEdit.pricePerDay || '',
            machOperator: (machineToEdit.operatorIncluded ? 'sa-rukovaocem' : 'bez-rukovaoca') as 'bez-rukovaoca' | 'sa-rukovaocem',
            machWeight: machineToEdit.weightKg || '',
            machWeightKg: machineToEdit.weightKg?.toString() || '',
            machLengthMm: machineToEdit.lengthMm?.toString() || '',
            machWidthMm: machineToEdit.widthMm?.toString() || '',
            machHeightMm: machineToEdit.heightMm?.toString() || '',
            machLoadCapacityKg: machineToEdit.loadCapacityKg?.toString() || '',
            machBucketCapacityM3: machineToEdit.bucketCapacityM3?.toString() || '',
            machMaxDigDepthMm: machineToEdit.maxDigDepthMm?.toString() || '',
            machMaxReachMm: machineToEdit.maxReachMm?.toString() || '',
            machServiceHistory: machineToEdit.serviceHistory || '',
            machVideoUrl: machineToEdit.videoUrl || '',
            location: machineToEdit.locationSlug || '',
            phone: machineToEdit.phone || '',
            whatsapp: machineToEdit.whatsapp || false,
            images: machineToEdit.images || [],
            paket: machineToEdit.isPremium ? 'premium' : (machineToEdit.isUrgent ? 'urgent' : 'free')
          });
        }
      } else if (editType === 'company' || editType === 'firma' || editType === 'poslodavac') {
        const companyToEdit = item as any as CompanyData;
        if (companyToEdit && companyToEdit.id === editId) {
          setSelectedCategory('company');
          hasPopulatedEditRef.current = true;
          reset({
            ...getValues(),
            companyName: companyToEdit.name || '',
            companyPIB: companyToEdit.pib || '',
            companyAddress: companyToEdit.address || '',
            location: companyToEdit.locationSlug || '',
            phone: companyToEdit.phone || '',
            companyWorkingHours: companyToEdit.workingHours || '',
            companyDescription: companyToEdit.description || '',
            companyDescriptionValue: companyToEdit.description || '',
            companyMainCats: companyToEdit.mainCategories || [],
            companySubCats: companyToEdit.subCategories || [],
            companyCoverage: (companyToEdit.coverageType === 'regional' || companyToEdit.coverageType === 'national' || companyToEdit.coverageType === 'international') ? companyToEdit.coverageType : 'local',
            companyCoverageValue: companyToEdit.coverageValue || '',
            companyIG: companyToEdit.instagram || '',
            companyFB: companyToEdit.facebook || '',
            companyWeb: companyToEdit.website || '',
            companyLogo: companyToEdit.logo || '',
            images: companyToEdit.images || [],
            companyEmployees: companyToEdit.employeeCount || '1-5',
            companyPortfolioImages: companyToEdit.portfolioImages || [],
            companyReferences: companyToEdit.references?.join('\n') || '',
            companyLicenses: companyToEdit.licenses?.join('\n') || '',
            companyCertifications: companyToEdit.certifications?.join('\n') || '',
            companyEquipmentSummary: companyToEdit.equipmentSummary || '',
            companyTeamSpecialties: companyToEdit.teamSpecialties?.join('\n') || '',
            paket: companyToEdit.isPremium ? 'premium' : (companyToEdit.isUrgent ? 'urgent' : 'free')
          });
        }
      } else if (editType === 'smestaj' || editType === 'accommodation') {
        const accToEdit = item as any as AccommodationData;
        if (accToEdit && accToEdit.id === editId) {
          setSelectedCategory('accommodation');
          hasPopulatedEditRef.current = true;
          reset({
            ...getValues(),
            accType: accToEdit.typeSlug || '',
            location: accToEdit.locationSlug || '',
            totalBeds: accToEdit.totalBeds?.toString() || '',
            availableBeds: accToEdit.availableBeds?.toString() || '',
            price: accToEdit.price || '',
            priceType: accToEdit.priceType || 'perPerson',
            amenities: accToEdit.amenities || [],
            opis: accToEdit.description || '',
            images: accToEdit.images || [],
            paket: accToEdit.isPremium ? 'premium' : (accToEdit.isUrgent ? 'urgent' : 'free'),
            accDistanceToSiteKm: accToEdit.distanceToSiteKm?.toString() || '',
            accParkingAvailable: accToEdit.parkingAvailable || false,
            accTruckAccess: accToEdit.truckAccess || false,
            accLaundryAvailable: accToEdit.laundryAvailable || false,
            accKitchenAvailable: accToEdit.kitchenAvailable || false,
            accWifiAvailable: accToEdit.wifiAvailable || false,
            accAirConditioning: accToEdit.airConditioning || false,
            accInvoiceAvailable: accToEdit.invoiceAvailable || false,
            accMinStayDays: accToEdit.minStayDays?.toString() || '',
            accContactPhone: accToEdit.contactPhone || ''
          });
        }
      } else if (editType === 'ketering' || editType === 'catering') {
        const catToEdit = item as any as CateringData & { telefon?: string, contactPhone?: string };
        if (catToEdit && catToEdit.id === editId) {
          setSelectedCategory('catering');
          hasPopulatedEditRef.current = true;
          reset({
            ...getValues(),
            catTitle: catToEdit.title || '',
            catKitchenType: catToEdit.kitchenType || '',
            location: catToEdit.locationSlug || '',
            tacnaLokacija: catToEdit.tacnaLokacija || '',
            catMinOrder: catToEdit.minOrder?.toString() || '',
            catPricePerMeal: catToEdit.pricePerMeal || '',
            catDeliveryZone: catToEdit.deliveryZone || '',
            amenities: catToEdit.amenities || [],
            opis: catToEdit.description || '',
            phone: catToEdit.telefon || catToEdit.contactPhone || '',
            images: catToEdit.images || [],
            paket: catToEdit.isPremium ? 'premium' : (catToEdit.isUrgent ? 'urgent' : 'free'),
            catInvoiceAvailable: catToEdit.invoiceAvailable || false,
            catHaccpCertified: catToEdit.haccpCertified || false,
            catPackagingIncluded: catToEdit.packagingIncluded || false,
            catDailyCapacityMeals: catToEdit.dailyCapacityMeals?.toString() || '',
            catContactPhone: catToEdit.contactPhone || '',
            catMenuItems: catToEdit.menuItems?.join('\n') || ''
          });
        }
      } else if (editId && (editType === 'job' || editType === 'posao')) {
        const jobToEdit = item as any as JobData & { sal?: string, salary?: string, telefon?: string, phone?: string };
        if (jobToEdit) {
          const salStr = jobToEdit.sal || jobToEdit.salary || '';
          const salParts = salStr.toString().replace('€', '').split(' — ');
          const min = salParts[0]?.trim();
          const max = salParts[1]?.trim();
          
          setSelectedCategory('job');
          hasPopulatedEditRef.current = true;
          reset({
            ...getValues(),
            sector: jobToEdit.sectorSlug || '',
            profession: jobToEdit.professionSlug || '',
            location: jobToEdit.locationSlug || '',
            plataMin: min || '',
            plataMax: max || '',
            dinamikaIsplate: 'mesecna', 
            iskustvo: jobToEdit.experienceSlug || '',
            tipAngazmana: jobToEdit.engagementSlug || 'puno-radno-vreme',
            benefiti: jobToEdit.benefits || [],
            opis: jobToEdit.description || '', 
            phone: jobToEdit.telefon || jobToEdit.phone || '',
            email: '',
            paket: jobToEdit.isPremium ? 'premium' : 'free'
          });
        }
      } else if (editType === 'marketplace' || editType === 'berza' || editType === 'alat-i-oprema') {
        const marketToEdit = item as any as MarketplaceData & { telefon?: string, phone?: string }; 
        if (marketToEdit && marketToEdit.id === editId) {
          setSelectedCategory('marketplace');
          hasPopulatedEditRef.current = true;
          reset({
            ...getValues(),
            title: marketToEdit.title || '',
            marketCategory: marketToEdit.marketCategory || '',
            marketCondition: marketToEdit.marketCondition || 'new',
            marketValue: marketToEdit.price || '',
            location: marketToEdit.locationSlug || '',
            tacnaLokacija: marketToEdit.address || '',
            opis: marketToEdit.description || '',
            images: marketToEdit.images || [],
            phone: marketToEdit.phone || marketToEdit.telefon || '',
            paket: marketToEdit.isPremium ? 'premium' : (marketToEdit.isUrgent ? 'urgent' : 'free')
          });
        }
      }
    }
  }, [editItem, editFlag, editId, editType, getValues, reset]);


  const onFormSubmit = async (data: AdFormData) => {
    if (!user) return;

    return traceAsync('ad_submission_total', async () => {
      if (!user?.emailVerified && user?.role !== 'admin') {
        showError("Vaš email nije verifikovan. Molimo verifikujte email pre postavljanja oglasa.");
        return;
      }

    if (isUploadingImages) {
      showError("Molimo sačekajte da se slike otpreme pre objavljivanja oglasa.");
      return;
    }

    if (cooldown > 0) {
      showError(`Molimo sačekajte još ${cooldown} sekundi pre objave novog oglasa (Zaštita od spama).`);
      return;
    }

    setIsSubmitting(true);
    try {
      const sData = { ...data };

      // Final schema validation before API submission
      const schema = getValidationSchema(selectedCategory);
      if (schema) {
        const validationResult = await schema.safeParseAsync(sData);
        if (!validationResult.success) {
          const firstError = validationResult.error.issues[0];
          showError(`Validacija nije uspela: ${firstError?.message || "Nepoznata greška"} (${firstError?.path?.join('.') || ""})`);
          setIsSubmitting(false);
          return;
        }
      }

      // Upload images before moderation
      const finalImages = [];
      const images = sData.images as (string | File)[];
      if (images && images.length > 0) {
        setIsUploadingImages(true);
        for (const img of images) {
          if (typeof img === 'string' && img.startsWith('blob:')) {
            const file = pendingFilesRef.current[img];
            if (file) {
              const uploadedUrl = await uploadImageDirectly(file);
              finalImages.push(uploadedUrl);
            }
          } else if (typeof img === 'string') {
            finalImages.push(img);
          }
        }
        sData.images = finalImages;
        setValue('images', finalImages);
        setIsUploadingImages(false);
      }

      const finalPortfolio = [];
      const portfolio = sData.companyPortfolioImages as (string | File)[] | undefined;
      if (selectedCategory === 'company' && portfolio && portfolio.length > 0) {
        setIsUploadingImages(true);
        for (const img of portfolio) {
          if (typeof img === 'string' && img.startsWith('blob:')) {
            const file = pendingFilesRef.current[img];
            if (file) {
              const uploadedUrl = await uploadImageDirectly(file);
              finalPortfolio.push(uploadedUrl);
            }
          } else if (typeof img === 'string') {
            finalPortfolio.push(img);
          }
        }
        sData.companyPortfolioImages = finalPortfolio;
        setValue('companyPortfolioImages', finalPortfolio);
        setIsUploadingImages(false);
      }
      
      const allImagesToScan = [...(Array.isArray(sData.images) ? sData.images : []), ...(selectedCategory === 'company' && Array.isArray(sData.companyPortfolioImages) ? sData.companyPortfolioImages : [])].filter((i): i is string => typeof i === 'string');
      if (allImagesToScan.length > 0) {
        try {
          const aiCheck = await moderationService.moderateGalleryAI(allImagesToScan);
          if (!aiCheck.isSafe) {
            showError(`Sadržaj odbijen: ${aiCheck.reason}`);
            setIsSubmitting(false);
            return;
          }
        } catch (err) {
          console.warn("AI Moderation bypass due to error:", err);
        }
      }
      
      const commonMeta = {
        authorId: user.id || user.uid,
        authorName: user.name || (user.firstName + ' ' + (user.lastName || '')).trim() || 'Korisnik',
        authorEmail: user.email,
        authorRole: user.role,
        companyId: (user as { companyId?: string }).companyId || null,
        companyName: user.company || null,
        companyLogo: (user as { companyLogo?: string }).companyLogo || null,
        isCompanyVerified: !!user.isVerified,
        isUrgent: sData.paket === 'urgent',
        isPremium: sData.paket === 'premium',
        status: 'pending' as const,
        type: selectedCategory === 'machines' ? 'machine' : (selectedCategory || 'other'),
        title: getAutoTitle(sData, selectedCategory, user),
        phone: sData.phone || '',
        viber: !!sData.viber,
        whatsapp: !!sData.whatsapp,
        email: sData.email || user.email || ''
      };

      const payload: AdItemData = applyPayloadTransform(selectedCategory, sData, commonMeta) as any as AdItemData;

      const categoryMap: Record<string, string> = {
        'job': 'jobs',
        'company': 'companies',
        'plot': 'plots',
        'accommodation': 'accommodations',
        'catering': 'caterings'
      };
      const categoryToApi = categoryMap[selectedCategory || ''] || selectedCategory || '';

      submitMutation.mutate({ categoryToApi, payload, sData });
    } catch (error) {
      if (error instanceof Error) {
        showError(error.message);
      } else {
        showError("Došlo je do greške");
      }
      setIsSubmitting(false);
    } 
  }); // Close traceAsync
  };

  const submitMutation = useMutation({
    mutationFn: async ({ categoryToApi, payload, sData }: { categoryToApi: string; payload: AdItemData; sData: AdFormData }) => {
      if (!categoryToApi) throw new Error("Kategorija nije definisana.");
      if (!navigator.onLine) {
        throw new Error("Niste povezani na mrežu. Sve akcije objavljivanja i izmene oglasnog prostora su privremeno obustavljene.");
      }
      if (editId) {
        await apiClient.patch(`/ads/${editId}`, { category: categoryToApi, data: payload });
        return { isEdit: true, id: editId, sData };
      } else {
        const result = await apiClient.post<AdItemData>('/ads/create', { category: categoryToApi, data: { ...payload, id: adId } });
        return { isEdit: false, id: result?.id as string, sData };
      }
    },
    onMutate: async () => {
      // Prompt 7: Prevent stale queries from writing over newly added status
      await queryClient.cancelQueries({ queryKey: ['ads'] });
      if (user?.id) {
        await queryClient.cancelQueries({ queryKey: dashboardKeys.myAds.user(user.id) });
      }
    },
    onSuccess: (result) => {
      if (result && result.id && !result.isEdit) {
        setCreatedAdId(result.id);
      }
      if (!result.isEdit) {
        localStorage.setItem(LAST_POST_KEY, Date.now().toString());
        localStorage.removeItem('postAdDraft');

        // Optimisic Updates za +1 Total Active umesto api zagušenja 
        if (user?.id) {
          const role = user.role;
          const bffKey = dashboardKeys.bff(role, user.id);
          queryClient.setQueryData(bffKey, (old: { stats?: { totalAds?: number } } | undefined) => {
            if (!old || !old.stats) return old;
            return {
              ...old,
              stats: {
                ...old.stats,
                totalAds: (old.stats.totalAds || 0) + 1
              }
            };
          });
        }
      }

      setIsSubmitted(true);
      showSuccess(editId ? 'Oglas uspešno izmenjen!' : 'Oglas uspešno postavljen!');
      reset();
      resetFormStore();
      // Optimizacija: Uklonjen queryClient.invalidateQueries({ queryKey: ['ads'] }) kako bi izbegli masovni refetch.
      // Lista će se refetch-ovati prirodno kada joj istekne stale time ili putem optimistic updates.
    },
    onError: (error: Error) => {
      if (error.message && error.message.includes("Nemate dovoljno sredstava u Wallet-u")) {
        showError("Nemate dovoljno sredstava na Wallet-u. Molimo uplatite depozit.");
        setShowDepositPrompt(true);
      } else {
        showError(error.message);
      }
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  const handleImageUploadWrapper = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (!files.length) return;

    // Validate size and format
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB

    const validFiles: File[] = [];
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        showError(`Fajl "${file.name}" nije u dozvoljenom formatu. Podržani formati su JPEG, PNG i WEBP.`);
        continue;
      }
      if (file.size > maxSizeBytes) {
        showError(`Fajl "${file.name}" je prevelik. Maksimalna dozvoljena veličina je 5MB.`);
        continue;
      }
      validFiles.push(file);
    }

    if (!validFiles.length) return;

    const currentImages = getValues('images') || [];
    if (currentImages.length + validFiles.length > MAX_AD_IMAGES) {
      showError(`Maksimalno možete otpremiti ${MAX_AD_IMAGES} slika po oglasu.`);
      return;
    }

    const newUrls = validFiles.map(file => {
      const url = URL.createObjectURL(file);
      pendingFilesRef.current[url] = file;
      return url;
    });
    setValue('images', [...currentImages, ...newUrls]);
  };

  const removeImage = (index: number) => {
    const currentImages = getValues('images') || [];
    const imageToRemove = currentImages[index];
    
    if (typeof imageToRemove === 'string' && imageToRemove.startsWith('blob:')) {
      delete pendingFilesRef.current[imageToRemove];
      URL.revokeObjectURL(imageToRemove); // Cleanup memory
    }
    
    setValue('images', currentImages.filter((_img: string | File, i: number) => i !== index));
  };

  const handlePortfolioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (!files.length) return;

    // Validate size and format
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB

    const validFiles: File[] = [];
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        showError(`Fajl "${file.name}" nije u dozvoljenom formatu. Podržani formati su JPEG, PNG i WEBP.`);
        continue;
      }
      if (file.size > maxSizeBytes) {
        showError(`Fajl "${file.name}" je prevelik. Maksimalna dozvoljena veličina je 5MB.`);
        continue;
      }
      validFiles.push(file);
    }

    if (!validFiles.length) return;

    const newUrls = validFiles.map(file => {
      const url = URL.createObjectURL(file);
      pendingFilesRef.current[url] = file;
      return url;
    });
    const currentPortfolio = getValues('companyPortfolioImages') || [];
    setValue('companyPortfolioImages', [...currentPortfolio, ...newUrls]);
  };

  const removePortfolioImage = (index: number) => {
    const currentPortfolio = getValues('companyPortfolioImages') || [];
    const imageToRemove = currentPortfolio[index];
    
    if (typeof imageToRemove === 'string' && imageToRemove.startsWith('blob:')) {
      delete pendingFilesRef.current[imageToRemove];
      URL.revokeObjectURL(imageToRemove); // Cleanup memory
    }
    
    setValue('companyPortfolioImages', currentPortfolio.filter((_img: string | File, i: number) => i !== index));
  };

  const nextStep = async () => {
    if (!selectedCategory) return;
    
    const STEP_FIELDS_MAP: Record<string, Record<number, string[]>> = {
      company: {
        1: ['companyName', 'companyPIB', 'location', 'companyAddress', 'companyDescription', 'phone', 'companyWorkingHours', 'companyIG', 'companyFB', 'companyWeb'],
        2: ['companyMainCats', 'companySubCats', 'companyCoverage', 'companyCoverageValue', 'companyEmployees'],
        3: ['companySubCats', 'companyReferences', 'companyTeamSpecialties', 'companyLicenses', 'companyCertifications', 'companyEquipmentSummary', 'companyPortfolioImages']
      },
      machines: {
        1: ['machCategory', 'machSubCategory', 'machBrand', 'machModel', 'location', 'tacnaLokacija'],
        2: ['machAdType', 'machPrice', 'machPricePerDay', 'machYear', 'machHours', 'machOperator', 'machPower', 'machFuel', 'machWeight', 'machWeightKg', 'machLengthMm', 'machWidthMm', 'machHeightMm', 'machLoadCapacityKg', 'machBucketCapacityM3', 'machMaxDigDepthMm', 'machMaxReachMm']
      },
      accommodation: {
        1: ['accType', 'location', 'tacnaLokacija'],
        2: ['totalBeds', 'availableBeds', 'price', 'priceType', 'accDistanceToSiteKm', 'accMinStayDays']
      },
      catering: {
        1: ['catKitchenType', 'location', 'tacnaLokacija'],
        2: ['catMinOrder', 'catPricePerMeal', 'catDeliveryZone', 'catDailyCapacityMeals']
      },
      plot: {
        1: ['plotPurpose', 'location', 'tacnaLokacija'],
        2: ['plotArea', 'plotAreaUnit', 'plotPrice', 'plotCurrency', 'plotAccessRoad', 'plotOccupancy', 'plotCadastralNumber', 'plotCadastralMunicipality', 'plotBuildabilityIndex', 'plotMaxFloors', 'plotMinParcelSize', 'plotMaxParcelSize', 'plotBuildingHeight', 'plotParkingStandard', 'plotProductionParkingStandard', 'plotParcelNumbers', 'plotMunicipalityName', 'plotPopulationEstimate', 'plotAverageSalary', 'plotMarketValueEstimate', 'plotDevelopmentFeeBusiness', 'plotDevelopmentFeeResidential']
      },
      marketplace: {
        1: ['marketCategory', 'title', 'location', 'tacnaLokacija'],
        2: ['marketCondition', 'marketValue']
      },
      job: {
        1: ['sector', 'profession', 'location', 'tacnaLokacija'],
        2: ['plataMin', 'plataMax', 'iskustvo', 'tipAngazmana', 'dinamikaIsplate']
      }
    };

    const commonStep3Fields = ['opis', 'phone', 'email', 'viber', 'whatsapp', 'images'];
    
    let fieldsToValidate: string[] = STEP_FIELDS_MAP[selectedCategory]?.[step] || [];
    
    if (step === 3 && selectedCategory !== 'company') {
      fieldsToValidate = commonStep3Fields;
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setTimeout(() => {
        const { errors } = methods.formState;
        const firstErrorKey = Object.keys(errors)[0];
        if (firstErrorKey) {
          const errorElement = document.querySelector(`[name="${firstErrorKey}"]`);
          if (errorElement) {
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            (errorElement as HTMLElement).focus?.();
          } else {
            const fallbackElement = document.querySelector('.text-error, .border-error, [aria-invalid="true"]');
            if (fallbackElement) {
              fallbackElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        } else {
           const fallbackElement = document.querySelector('.text-error, .border-error, [aria-invalid="true"]');
            if (fallbackElement) {
              fallbackElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
      }, 100);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return {
    methods, formData, rhfHandleSubmit, onFormSubmit,
    selectedCategory, setSelectedCategory,
    step, setStep, nextStep, prevStep,
    isUploadingImages, isSubmitting, setIsSubmitting,
    isSubmitted, setIsSubmitted,
    createdAdId,
    sessionRefId,
    paymentTab, setPaymentTab,
    cooldown, setCooldown,
    editItem, setEditItem,
    hasPopulatedEditRef,
    showDraftPrompt, setShowDraftPrompt,
    showDepositPrompt, setShowDepositPrompt,
    handleImageUpload: handleImageUploadWrapper, removeImage,
    handlePortfolioUpload, removePortfolioImage,
    showError, showSuccess, user
  };
}
