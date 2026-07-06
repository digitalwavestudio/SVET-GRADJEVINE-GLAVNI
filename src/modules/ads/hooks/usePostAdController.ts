import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { collection, doc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useToast } from '@/src/context/ToastContext';
import { useAuth } from '@/src/context/AuthContext';
import { moderationService } from '@/src/services/moderationService';
import { apiClient } from '@/src/lib/apiClient';

import { getValidationSchema, getAutoTitle } from '@/src/modules/ads/utils/adUtils';
import { applyPayloadTransform } from '@/src/modules/ads/hooks/usePostAdControllerPayload';
import { usePostAdStore } from '@/src/modules/ads/stores/usePostAdStore';
import { mapEditItemToFormData } from '@/src/modules/ads/utils/adMappers';

import { useAdDraft } from '@/src/modules/ads/hooks/useAdDraft';
import { useAdImageUpload } from '@/src/modules/ads/hooks/useAdImageUpload';
import { useAdSubmit } from '@/src/modules/ads/hooks/useAdSubmit';

interface UsePostAdControllerProps {
  initialPackage: string;
  editId?: string | null;
  editType?: string | null;
  editFlag?: string | null;
  launchMode?: boolean;
}

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

export interface AdFormData {
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
  benefits: string[];
  amenities: string[];
  plotDocs: { label: string; url: string }[];
  companyPortfolioImages?: (string | File)[];
  plotInfrastructure?: Record<string, boolean>;
  [key: string]: string | boolean | string[] | (string | File)[] | { label: string; url: string }[] | Record<string, boolean> | undefined | null | number;
}

export function usePostAdController({ initialPackage, editId, editType, editFlag, launchMode }: UsePostAdControllerProps) {
  const { showSuccess, showError } = useToast();
  const { user, updateUser } = useAuth();

  const selectedCategory = usePostAdStore((state) => state.selectedCategory);
  const setSelectedCategory = usePostAdStore((state) => state.setSelectedCategory);
  const step = usePostAdStore((state) => state.step);
  const setStep = usePostAdStore((state) => state.setStep);
  const formDataStore = usePostAdStore((state) => state.formData);
  const setFormDataStore = usePostAdStore((state) => state.setFormData);
  const resetFormStore = usePostAdStore((state) => state.resetForm);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentTab, setPaymentTab] = useState<'uplatnica' | 'faktura'>('uplatnica');
  const [editItem, setEditItem] = useState<AdItemData | null>(null);

  const [adId] = useState(() => {
    if (editId) return editId;
    return doc(collection(db, 'listings')).id;
  });
  const [sessionRefId] = useState(() => crypto.randomUUID().substring(0, 6));

  const editItemFetchedRef = useRef(false);
  const hasPopulatedEditRef = useRef(false);

  // --- Composed hooks ---
  const draft = useAdDraft(editId);
  const imageUpload = useAdImageUpload(showError);

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
      benefits: [],
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

  const submit = useAdSubmit({
    editId,
    adId,
    userId: user?.id || user?.uid,
    showSuccess,
    showError,
    reset,
    resetFormStore,
    updateUser,
    setIsSubmitting,
  });

  // Edit item fetching
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

    if (editFlag === 'true' && editId && editType) {
      const mappedData = mapEditItemToFormData(editType, editId, editItem, getValues);
      if (mappedData) {
        hasPopulatedEditRef.current = true;

        if (editType === 'plac' || editType === 'placevi') setSelectedCategory('plot');
        else if (editType === 'masine' || editType === 'machine' || editType === 'gradjevinske-masine') setSelectedCategory('machines');
        else if (editType === 'company' || editType === 'firma' || editType === 'poslodavac') setSelectedCategory('company');
        else if (editType === 'smestaj' || editType === 'accommodation') setSelectedCategory('accommodation');
        else if (editType === 'ketering' || editType === 'catering') setSelectedCategory('catering');
        else if (editType === 'job' || editType === 'posao') setSelectedCategory('job');
        else if (editType === 'marketplace' || editType === 'berza' || editType === 'alat-i-oprema') setSelectedCategory('marketplace');

        reset(mappedData);
      }
    }
  }, [editItem, editFlag, editId, editType, getValues, reset, setSelectedCategory]);

  const onFormSubmit = async (data: AdFormData) => {
    if (!user) return;

    return (async () => {
      if (!user?.emailVerified && user?.role !== 'admin') {
        showError("Vaš email nije verifikovan. Molimo verifikujte email pre postavljanja oglasa.");
        return;
      }

      if (imageUpload.isUploadingImages) {
        showError("Molimo sačekajte da se slike otpreme pre objavljivanja oglasa.");
        return;
      }

      if (draft.cooldown > 0) {
        showError(`Molimo sačekajte još ${draft.cooldown} sekundi pre objave novog oglasa (Zaštita od spama).`);
        return;
      }

      setIsSubmitting(true);
      try {
        const sData = { ...data };

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
        const images = sData.images as (string | File)[];
        if (images && images.length > 0) {
          imageUpload.setIsUploadingImages(true);
          sData.images = await imageUpload.uploadPendingImages(images);
          setValue('images', sData.images);
          imageUpload.setIsUploadingImages(false);
        }

        const portfolio = sData.companyPortfolioImages as (string | File)[] | undefined;
        if (selectedCategory === 'company' && portfolio && portfolio.length > 0) {
          imageUpload.setIsUploadingImages(true);
          sData.companyPortfolioImages = await imageUpload.uploadPendingImages(portfolio);
          setValue('companyPortfolioImages', sData.companyPortfolioImages);
          imageUpload.setIsUploadingImages(false);
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

        submit.submitMutation.mutate({ categoryToApi, payload, sData });
      } catch (error) {
        if (error instanceof Error) {
          showError(error.message);
        } else {
          showError("Došlo je do greške");
        }
        setIsSubmitting(false);
      }
    })();
  };

  const nextStep = async () => {
    if (!selectedCategory) return;

    const STEP_FIELDS_MAP: Record<string, Record<number, string[]>> = {
      company: {
        1: ['companyName', 'location', 'companyAddress', 'companyDescription', 'phone', 'companyWorkingHours', 'companyIG', 'companyFB', 'companyWeb'],
        2: ['companyMainCats', 'companySubCats', 'companyCoverage', 'companyCoverageValue'],
        3: ['companySubCats', 'companyReferences', 'companyTeamSpecialties', 'companyLicenses', 'companyCertifications', 'companyEquipmentSummary', 'companyPortfolioImages']
      },
      machines: {
        1: ['machCategory', 'machSubCategory', 'machBrand', 'machModel', 'location'],
        2: ['machAdType', 'machPrice', 'machPricePerDay', 'machYear', 'machHours', 'machOperator', 'machPower', 'machFuel', 'machWeight', 'machWeightKg', 'machLengthMm', 'machWidthMm', 'machHeightMm', 'machLoadCapacityKg', 'machBucketCapacityM3', 'machMaxDigDepthMm', 'machMaxReachMm']
      },
      accommodation: {
        1: ['accType', 'location'],
        2: ['totalBeds', 'availableBeds', 'price', 'priceType', 'accDistanceToSiteKm', 'accMinStayDays']
      },
      catering: {
        1: ['catKitchenType', 'location'],
        2: ['catMinOrder', 'catPricePerMeal', 'catDeliveryZone', 'catDailyCapacityMeals']
      },
      plot: {
        1: ['plotPurpose', 'location'],
        2: ['plotArea', 'plotAreaUnit', 'plotPrice', 'plotCurrency', 'plotAccessRoad', 'plotOccupancy', 'plotCadastralNumber', 'plotCadastralMunicipality', 'plotBuildabilityIndex', 'plotMaxFloors', 'plotMinParcelSize', 'plotMaxParcelSize', 'plotBuildingHeight', 'plotParkingStandard', 'plotProductionParkingStandard', 'plotParcelNumbers', 'plotMunicipalityName', 'plotPopulationEstimate', 'plotAverageSalary', 'plotMarketValueEstimate', 'plotDevelopmentFeeBusiness', 'plotDevelopmentFeeResidential']
      },
      marketplace: {
        1: ['marketCategory', 'title', 'location'],
        2: ['marketCondition', 'marketValue']
      },
      job: {
        1: ['sector', 'profession', 'location'],
        2: ['plataMin', 'plataMax', 'dinamikaIsplate']
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
    isUploadingImages: imageUpload.isUploadingImages,
    isSubmitting, setIsSubmitting,
    isSubmitted: submit.isSubmitted,
    setIsSubmitted: submit.setIsSubmitted,
    submittedPackage: submit.submittedPackage,
    createdAdId: submit.createdAdId,
    sessionRefId,
    paymentTab, setPaymentTab,
    cooldown: draft.cooldown,
    setCooldown: draft.setCooldown,
    editItem, setEditItem,
    hasPopulatedEditRef,
    showDraftPrompt: draft.showDraftPrompt,
    setShowDraftPrompt: draft.setShowDraftPrompt,
    showDepositPrompt: submit.showDepositPrompt,
    setShowDepositPrompt: submit.setShowDepositPrompt,
    handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => imageUpload.handleImageUpload(e, setValue, getValues),
    removeImage: (index: number) => imageUpload.removeImage(index, setValue, getValues),
    handlePortfolioUpload: (e: React.ChangeEvent<HTMLInputElement>) => imageUpload.handlePortfolioUpload(e, setValue, getValues),
    removePortfolioImage: (index: number) => imageUpload.removePortfolioImage(index, setValue, getValues),
    showError, showSuccess, user
  };
}
