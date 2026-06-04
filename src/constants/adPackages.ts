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
  price: '500 SG Kredita', 
  priceNum: 500,
  oldPrice: null, 
  desc: '30 dana • Standardno prikazivanje', 
  features: ['Objavite oglas', 'Osnovna pozicija u pretrazi'], 
  color: 'white' 
};

export const PACKAGES_BY_CATEGORY: Record<string, AdPackage[]> = {
  job: [
    STANDARD_PAID,
    { id: 'premium', name: 'PREMIUM OGLAS', price: '1.000 SG Kredita', priceNum: 1000, oldPrice: null, desc: '30 dana • Istaknut + Logo', features: ['Na vrhu pretrage', 'Istaknut dizajn i boja'], color: 'secondary', recommended: true },
    { id: 'urgent', name: 'HITNO (URGENT)', price: '1.500 SG Kredita', priceNum: 1500, oldPrice: null, desc: '15 dana • Najviši prioritet', features: ['Bedž HITNO', 'Prva sekcija na naslovnoj'], color: 'primary' }
  ],
  marketplace: [
    STANDARD_PAID,
    { id: 'premium', name: 'PREMIUM OGLAS', price: '1.000 SG Kredita', priceNum: 1000, oldPrice: null, desc: '30 dana • Istaknut + Logo', features: ['Na vrhu pretrage', 'Istaknut dizajn i boja'], color: 'secondary', recommended: true },
    { id: 'urgent', name: 'HITNO (URGENT)', price: '1.500 SG Kredita', priceNum: 1500, oldPrice: null, desc: '15 dana • Najviši prioritet', features: ['Bedž HITNO', 'Prva sekcija na naslovnoj'], color: 'primary' }
  ],
  machines: [
    STANDARD_PAID,
    { id: 'premium', name: 'PREMIUM OGLAS', price: '1.000 SG Kredita', priceNum: 1000, oldPrice: null, desc: '30 dana • Istaknut + Logo', features: ['Na vrhu pretrage', 'Istaknut dizajn i boja'], color: 'secondary', recommended: true },
    { id: 'urgent', name: 'HITNO (URGENT)', price: '1.500 SG Kredita', priceNum: 1500, oldPrice: null, desc: '15 dana • Najviši prioritet', features: ['Bedž HITNO', 'Prva sekcija na naslovnoj'], color: 'primary' }
  ],
  accommodation: [
    STANDARD_PAID,
    { id: 'premium', name: 'PRETPLATA SMEŠTAJ', price: '3.000 SG Kredita', priceNum: 3000, oldPrice: null, desc: '3 meseca • Premium pristup', features: ['Istaknuto u smeštaju', 'Dostupno radnicima'], color: 'secondary', recommended: true }
  ],
  catering: [
    STANDARD_PAID,
    { id: 'premium', name: 'PRETPLATA KETERING', price: '3.000 SG Kredita', priceNum: 3000, oldPrice: null, desc: '3 meseca • Premium pristup', features: ['Istaknuto u keteringu', 'Dostupno na radovima'], color: 'secondary', recommended: true }
  ],
  plot: [
    STANDARD_PAID,
    { id: 'premium', name: 'PREMIUM OGLAS', price: '6.000 SG Kredita', priceNum: 6000, oldPrice: null, desc: '3 meseca • Istaknuto prodaja/izdavanje placeva', features: ['Na vrhu pretrage', 'Istaknut dizajn'], color: 'secondary', recommended: true }
  ],
  company: [
    { ...STANDARD_PAID, desc: 'Osnovna registracija firme', features: ['Upis u registar', 'Osnovni profil'] },
    { id: 'premium_partner', name: 'PREMIUM PARTNER', price: '6.000 SG Kredita', priceNum: 6000, oldPrice: null, desc: 'Jednokratno • Doživotni bedž', features: ['Bedž Premium Partner', 'Veća poverljivost', 'Istaknut profil'], color: 'secondary' }
  ]
};

// Fallback for types that might map differently
const mapCategory = (category: string) => {
  if (category === 'real-estate') return 'plot';
  if (category === 'business') return 'company';
  return category;
};

export const getPackagesByCategory = (category: string) => {
  return PACKAGES_BY_CATEGORY[mapCategory(category)] || [STANDARD_PAID];
};

export const getPackageById = (categoryId: string, packageId: string) => {
  const pkgs = getPackagesByCategory(categoryId);
  return pkgs.find(p => p.id === packageId) || pkgs[0];
};
