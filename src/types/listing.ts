// Blueprint for universal listing (to be used after migration)
export type ListingType = "job" | "catering" | "accommodation" | "machine" | "master";

export interface UniversalListing {
  id: string;
  type: ListingType;
  
  title: string;
  description: string;
  
  categoryId?: string;
  categoryName?: string;
  
  locationId?: string;
  locationName?: string;
  
  price?: number;
  priceType?: 'fixed' | 'hourly' | 'daily' | 'monthly' | 'negotiable';
  
  companyId?: string;
  companyName?: string;
  
  images: string[];
  
  isActive: boolean;
  isFeatured?: boolean;
  
  createdAt: number;
  updatedAt?: number;
  
  // Type-specific attributes
  attributes: Record<string, unknown>;
}
