import React from 'react';

import type { UserProfile } from '@svet-gradjevine/shared';

export type FormErrors = Record<string, string | string[]>;

export interface StepProps {
  formData: FormDataState;
  setFormData: React.Dispatch<React.SetStateAction<FormDataState>>;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  errors: FormErrors;
  selectedCategory: string;
  setSelectedCategory?: (c: string | null) => void;
  nextStep?: () => void;
  prevStep?: () => void;
  user?: UserProfile | null;
  handleAmenityToggle?: (amenityId: string) => void;
  handleBenefitToggle?: (benefitId: string) => void;
  handleFeatureToggle?: (featureId: string) => void;
  previewUrl?: string | null;
  fileInputRef?: React.RefObject<HTMLInputElement>;
  loadingPhoto?: boolean;
  uploadPhoto?: () => void;
  uploadImages?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeImage?: (index: number) => void;
  removeTempImage?: (index: number) => void;
  MAX_AD_IMAGES?: number;
  APP_CONFIG?: any;
  
  handleCompanyMainCatToggle?: (id: string) => void;
  handlePortfolioUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removePortfolioImage?: (index: number) => void;
  handleImageUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSectorChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  
  autoTitle?: string;
  launchMode?: boolean;
  isUploadingImages?: boolean;
  isSubmitting?: boolean;
  cooldown?: number;
  handleSubmit?: (e: any) => void;
  setStep?: (n: number) => void;
}


export interface FormDataState {
  location: string;
  tacnaLokacija: string;
  opis: string;
  phone: string;
  telefon?: string; // for backward compatibility in some components
  email: string;
  viber: boolean;
  whatsapp: boolean;
  images: string[];
  paket: string;

  // Job
  sector: string;
  profession: string;
  plataMin: string;
  plataMax: string;
  salaryType: 'hourly' | 'monthly';
  dinamikaIsplate: string;
  iskustvo: string;
  tipAngazmana: string;
  customEngagement: string;
  benefiti: string[];

  // Accommodation
  accType: string;
  totalBeds: string;
  availableBeds: string;
  price: string;
  priceType: 'perPerson' | 'total';
  amenities: string[];
  accTitle?: string;
  
  accDistanceToSiteKm: string;
  accParkingAvailable: boolean;
  accTruckAccess: boolean;
  accLaundryAvailable: boolean;
  accKitchenAvailable: boolean;
  accWifiAvailable: boolean;
  accAirConditioning: boolean;
  accInvoiceAvailable: boolean;
  accMinStayDays: string;
  accContactPhone: string;

  // Catering
  catKitchenType: string;
  catMinOrder: string;
  catPricePerMeal: string;
  catDeliveryZone: string;
  catTitle?: string;
  catDailyCapacityMeals?: string;
  catMenuItems?: string;
  catInvoiceAvailable?: boolean;
  catHaccpCertified?: boolean;
  catPackagingIncluded?: boolean;
  catContactPhone?: string;

  // Company
  companyName: string;
  companyPIB: string;
  companyAddress: string;
  companyEmployees: string;
  companyFoundedYear: string;
  companyDescription: string;
  companyWorkingHours: string;
  companyLogo: string;
  companyWeb: string;
  companyFB: string;
  companyIG: string;
  companyMainCats: string[];
  companySubCats: string[];
  companyCoverage: 'local' | 'regional' | 'national' | 'international';
  companyCoverageValue: string;

  companyPortfolioImages: string[];
  companyReferences: string;
  companyLicenses: string;
  companyCertifications: string;
  companyEquipmentSummary: string;
  companyTeamSpecialties: string;

  // Machine
  machBrand: string;
  machModel: string;
  machCategory: string;
  machSubCategory: string;
  machYear: string;
  machPower: string;
  machWeight: string;
  machHours: string;
  machFuel: string;
  machAdType: 'prodaja' | 'iznajmljivanje';
  machPrice: string;
  machPricePerDay: string;
  machOperator: 'bez-rukovaoca' | 'sa-rukovaocem';
  machDynamicSpecs: Record<string, string>;
  
  machWeightKg: string;
  machLengthMm: string;
  machWidthMm: string;
  machHeightMm: string;
  machLoadCapacityKg: string;
  machBucketCapacityM3: string;
  machMaxDigDepthMm: string;
  machMaxReachMm: string;
  machServiceHistory: string;
  machAttachments: string[];
  machVideoUrl: string;

  // Real Estate
  plotArea: string;
  plotAreaUnit: 'ari' | 'ha';
  plotPrice: string;
  plotCurrency: string;
  plotPurpose: 'građevinsko' | 'industrijsko' | 'poljoprivredno';
  address?: string; // alias/compat
  currency?: string; // alias/compat
  purpose?: string; // alias/compat
  plotInfrastructure: {
    struja: boolean;
    voda: boolean;
    kanalizacija: boolean;
    gas: boolean;
    optika: boolean;
  };
  plotAccessRoad: 'asfalt' | 'tucanik' | 'zemljani';

  plotCadastralNumber: string;
  plotCadastralMunicipality: string;
  plotOccupancy: string;
  plotBuildabilityIndex: string;
  plotMaxFloors: string;
  plotNotes: string;
  plotDocs: { label: string; url: string }[];

  plotHeating: boolean;
  plotTelephone: boolean;
  plotTechnicalWater: boolean;
  plotDrinkingWater: boolean;
  plotRailAccess: boolean;
  plotHighwayAccess: boolean;
  plotAirportAccess: boolean;
  plotPlannedPurpose: string;
  plotMinParcelSize: string;
  plotMaxParcelSize: string;
  plotBuildingHeight: string;
  plotParkingStandard: string;
  plotProductionParkingStandard: string;
  plotParcelNumbers: string;
  plotMunicipalityName: string;
  plotPopulationEstimate: string;
  plotAverageSalary: string;
  plotMarketValueEstimate: string;
  plotDevelopmentFeeBusiness: string;
  plotDevelopmentFeeResidential: string;
  plotFreeZone: boolean;
  plotGreenEnergySuitable: boolean;

  // Marketplace
  marketCategory: string;
  marketValue: string;
  marketCondition: 'novo' | 'polovno';
  title: string;
}
