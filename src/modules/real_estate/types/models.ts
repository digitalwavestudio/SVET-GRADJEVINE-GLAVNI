import { BaseEntity } from '@/src/modules/core/types/common';

export interface RealEstatePlot extends BaseEntity {
  title: string;
  description: string;
  searchKeywords?: string[];
  area: number; // in m2
  areaUnit?: 'ari' | 'ha';
  purpose: string; // 'industrial' | 'commercial' | 'residential' | 'agricultural'
  location: string;
  locationSlug: string;
  price?: number | string;
  currency: string;
  images: string[];
  imagePlaceholders?: string[];
  mainImage: string;
  contactPhone: string;
  contactEmail: string;
  accessRoad: boolean | 'asfalt' | 'tucanik' | 'zemlja';
  highwayAccess?: boolean;
  railAccess?: boolean;
  freeZone?: boolean;
  features?: string[];
  imageStatus?: 'processing' | 'ready' | 'failed';
  struja?: boolean | string;
  voda?: boolean | string;
  gas?: boolean | string;
  kanalizacija?: boolean | string;
  internet?: boolean | string;
  optika?: boolean | string;
  telefon?: boolean | string;
  infrastructure: {
    electricity: boolean;
    water: boolean;
    sewer: boolean;
    gas: boolean;
    internet: boolean;
    telephone?: boolean;
    technicalWater?: boolean;
    drinkingWater?: boolean;
    struja?: boolean;
    voda?: boolean;
    kanalizacija?: boolean;
    optika?: boolean;
  } | string[];
  permits?: string;

  // Phase 2 & 3 Fields
  cadastralNumber?: string;
  cadastralMunicipality?: string;
  occupancy?: number;
  buildabilityIndex?: number;
  maxFloors?: number;
  notes?: string;
  docs?: { label: string; url: string }[];
  contact?: {
    phone?: string;
    email?: string;
    person?: string;
  };
  heating?: boolean;
  technicalWater?: boolean;
  drinkingWater?: boolean;
  airportAccess?: boolean;
  plannedPurpose?: string;
  minParcelSize?: number;
  maxParcelSize?: number;
  buildingHeight?: number;
  parkingStandard?: string;
  productionParkingStandard?: string;
  parcelNumbers?: string;
  municipalityName?: string;
  populationEstimate?: number;
  averageSalary?: number;
  marketValueEstimate?: string;
  developmentFeeBusiness?: string;
  developmentFeeResidential?: string;
  greenEnergySuitable?: boolean;

  // Legacy fields
  plotArea?: string;
  pricePerM2?: string;
  usageType?: string;
  ownership?: string;
  urbanized?: boolean;
  isPremium?: boolean;
  isUrgent?: boolean;
  viewsCount?: number;
  status: 'pending' | 'approved' | 'rejected' | 'hidden' | string;
  authorId?: string;
  createdAt?: string | number | Date | null | { _seconds: number; _nanoseconds: number; toDate?: () => Date };
  
  address?: string;
  electricity?: boolean | string;
  sewer?: boolean | string;
  telephone?: boolean | string;
  companyLogo?: string;
  companyName?: string;
  isCompanyVerified?: boolean;
}

export interface RealEstateFilters {
  search?: string | null;
  location?: string | null;
  radius?: number;
  minArea?: number | null;
  maxArea?: number | null;
  purpose?: string;
  accessRoad?: string | null;
  highwayAccess?: boolean | null;
  railAccess?: boolean | null;
  freeZone?: boolean | null;
  authorId?: string;
  showAllStatuses?: boolean;
  status?: string;
  [key: string]: string | number | boolean | null | undefined;
}
