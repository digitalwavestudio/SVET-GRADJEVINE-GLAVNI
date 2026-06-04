import { TaxonomyItem } from '@/src/constants/taxonomy';

export const MACHINE_CATEGORIES: TaxonomyItem[] = [
  { id: 'zemljani-radovi', slug: 'zemljani-radovi', name: 'Zemljani radovi' },
  { id: 'beton-i-asfalt', slug: 'beton-i-asfalt', name: 'Beton i asfalt' },
  { id: 'dizanje-i-rad-na-visini', slug: 'dizanje-i-rad-na-visini', name: 'Dizanje i rad na visini' },
  { id: 'specijalne-masine', slug: 'specijalne-masine', name: 'Specijalne mašine' },
  { id: 'delovi-i-prikljucci', slug: 'delovi-i-prikljucci', name: 'Delovi i priključci' },
  { id: 'ostalo', slug: 'ostalo', name: 'Ostalo' }
];

export const MACHINE_SUBCATEGORIES: Record<string, TaxonomyItem[]> = {
  'zemljani-radovi': [
    { id: 'bageri', slug: 'bageri', name: 'Bageri' },
    { id: 'mini-bageri', slug: 'mini-bageri', name: 'Mini bageri' },
    { id: 'rovokopaci', slug: 'rovokopaci', name: 'Rovokopači' },
    { id: 'buldozeri', slug: 'buldozeri', name: 'Buldožeri' },
    { id: 'grejderi', slug: 'grejderi', name: 'Grejderi' },
    { id: 'dumperi', slug: 'dumperi', name: 'Dumperi' },
    { id: 'kiperi', slug: 'kiperi', name: 'Kiperi' }
  ],
  'beton-i-asfalt': [
    { id: 'pumpe-za-beton', slug: 'pumpe-za-beton', name: 'Pumpe za beton' },
    { id: 'mikseri', slug: 'mikseri', name: 'Mikseri' },
    { id: 'valjci', slug: 'valjci', name: 'Valjci' },
    { id: 'asfaltne-masine', slug: 'asfaltne-masine', name: 'Asfaltne mašine' }
  ],
  'dizanje-i-rad-na-visini': [
    { id: 'dizalica', slug: 'dizalica', name: 'Dizalice' },
    { id: 'radne-platforme', slug: 'radne-platforme', name: 'Radne platforme' },
    { id: 'skele', slug: 'skele', name: 'Skele' }
  ],
  'specijalne-masine': [
    { id: 'tunelske-masine', slug: 'tunelske-masine', name: 'Tunelske mašine' },
    { id: 'masine-za-cevovode', slug: 'masine-za-cevovode', name: 'Mašine za cevovode' },
    { id: 'masine-za-rusenje', slug: 'masine-za-rusenje', name: 'Mašine za rušenje' }
  ],
  'delovi-i-prikljucci': [
    { id: 'kasike', slug: 'kasike', name: 'Kašike' },
    { id: 'hidraulicni-cekici', slug: 'hidraulicni-cekici', name: 'Hidraulični čekići' },
    { id: 'rezervni-delovi', slug: 'rezervni-delovi', name: 'Rezervni delovi' }
  ],
  'ostalo': [
    { id: 'ostalo-pod', slug: 'ostalo-pod', name: 'Ostalo' }
  ]
};

// Mapiranje specifičnih polja po podkategorijama
export const DYNAMIC_MACHINE_FIELDS: Record<string, string[]> = {
  'bageri': ['weight', 'bucketVolume', 'digDepth'],
  'mini-bageri': ['weight', 'bucketVolume', 'digDepth'],
  'rovokopaci': ['weight', 'bucketVolume', 'digDepth'],
  'dizalica': ['capacity', 'liftHeight'],
  'radne-platforme': ['capacity', 'liftHeight'],
  'valjci': ['weight', 'rollerType'],
  'dumperi': ['capacity'],
  'kiperi': ['capacity']
};

export const COMMON_MACHINE_FIELDS = [
  'manufacturer', 
  'model', 
  'year', 
  'workingHours', 
  'powerKw', 
  'fuelType'
];

export const FUEL_TYPES: TaxonomyItem[] = [
  { id: 'dizel', slug: 'dizel', name: 'Dizel' },
  { id: 'benzin', slug: 'benzin', name: 'Benzin' },
  { id: 'struja', slug: 'struja', name: 'Struja' },
  { id: 'hibrid', slug: 'hibrid', name: 'Hibrid' },
  { id: 'gas', slug: 'gas', name: 'Gas' }
];

export const MACHINE_CONDITION_TYPES: TaxonomyItem[] = [
  { id: 'novo', slug: 'novo', name: 'Novo' },
  { id: 'polovno', slug: 'polovno', name: 'Polovno' }
];

export const ROLLER_TYPES = ['Jednobubanj', 'Dvobubanj', 'Ekskavatorski', 'Kombinovani'];
