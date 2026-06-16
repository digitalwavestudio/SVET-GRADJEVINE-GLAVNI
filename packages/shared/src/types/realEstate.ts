import { BaseEntity } from './common';

export interface RealEstatePlot extends BaseEntity {
  title: string;
  description: string;
  area: number; // in m2
  areaUnit?: 'ari' | 'ha';
  purpose: string; // 'industrial' | 'commercial' | 'residential' | 'agricultural'
  location: string;
  locationSlug: string;
  price?: number | string;
  currency: string;
  images: string[];
  mainImage: string;
  contactPhone: string;
  contactEmail: string;
  accessRoad: boolean | 'asfalt' | 'tucanik' | 'zemlja';
  highwayAccess?: boolean;
  railAccess?: boolean;
  freeZone?: boolean;
  features?: string[];
  infrastructure: {
    electricity: boolean;
    water: boolean;
    sewer: boolean;
    gas: boolean;
    internet: boolean;
    telephone?: boolean;
    technicalWater?: boolean;
    drinkingWater?: boolean;
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
  paket?: string;
  viewsCount?: number;
  status?: string;
  authorId?: string;
  createdAt?: string | number | Date | null | { _seconds: number; _nanoseconds: number };
  
  address?: string;
  electricity?: boolean | string;
  water?: boolean | string;
  sewer?: boolean | string;
  gas?: boolean | string;
  internet?: boolean | string;
  telephone?: boolean | string;
  companyLogo?: string;
  companyName?: string;
  isCompanyVerified?: boolean;
}
