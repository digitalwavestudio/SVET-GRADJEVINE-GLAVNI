export interface AdPackage {
  id: string;
  name: string;
  price: string;
  priceNum: number;
  oldPrice: string | null;
  desc: string;
  features: string[];
  color: string;
  recommended?: boolean;
  isDiscounted?: boolean;
}

const STANDARD_PAID: AdPackage = { 
  id: 'standard', 
  name: 'STANDARD', 
  price: '1.000 SG Kredita (1.000 RSD)', 
  priceNum: 1000,
  oldPrice: null, 
  desc: '30 dana • Standardno prikazivanje', 
  features: ['Objavite oglas', 'Osnovna pozicija u pretrazi'], 
  color: 'white' 
};

export const PACKAGES_BY_CATEGORY: Record<string, AdPackage[]> = {
  job: [
    STANDARD_PAID,
    { id: 'premium', name: 'PREMIUM OGLAS', price: '2.000 SG Kredita (2.000 RSD)', priceNum: 2000, oldPrice: null, desc: '30 dana • Istaknut + Logo', features: ['Na vrhu pretrage', 'Istaknut dizajn i boja'], color: 'secondary', recommended: true },
    { id: 'urgent', name: 'HITNO (URGENT)', price: '4.000 SG Kredita (4.000 RSD)', priceNum: 4000, oldPrice: null, desc: '15 dana • Najviši prioritet', features: ['Bedž HITNO', 'Prva sekcija na naslovnoj'], color: 'primary' }
  ],

};

// Fallback for types that might map differently
const mapCategory = (category: string) => {
  return category;
};

export const getPackagesByCategory = (category: string) => {
  return PACKAGES_BY_CATEGORY[mapCategory(category)] || [STANDARD_PAID];
};

export const getPackageById = (categoryId: string, packageId: string) => {
  const pkgs = getPackagesByCategory(categoryId);
  return pkgs.find(p => p.id === packageId) || pkgs[0];
};
