export interface TaxonomyItem {
  id: string;
  name: string;
  slug: string;
  shortName?: string;
  icon?: string;
}

export const CORE_SECTORS: TaxonomyItem[] = [
  { id: 'gruba-gradnja', slug: 'gruba-gradnja', name: 'Gruba gradnja', icon: 'foundation' },
  { id: 'zavrsni-radovi', slug: 'zavrsni-radovi', name: 'Završni radovi', icon: 'home_repair_service' },
  { id: 'instalacije-i-tehnika', slug: 'instalacije-i-tehnika', name: 'Instalacije i tehnika', icon: 'bolt' },
  { id: 'niskogradnja', slug: 'niskogradnja', name: 'Niskogradnja', icon: 'add_road' },
  { id: 'rukovaoc-gradjevinskom-mehanizacijom', slug: 'rukovaoc-gradjevinskom-mehanizacijom', name: 'Rukovaoc građevinskom mehanizacijom', icon: 'precision_manufacturing' },
  { id: 'metal-i-bravarija', slug: 'metal-i-bravarija', name: 'Metal i bravarija', icon: 'build' },
  { id: 'inzenjering', slug: 'inzenjering', name: 'Inženjering i projektovanje', icon: 'architecture' },
  { id: 'ostalo', slug: 'ostalo', name: 'Ostalo', icon: 'more_horiz' },
];

export const LOCATIONS: TaxonomyItem[] = [
  // Srbija
  { id: 'beograd', slug: 'beograd', name: 'Beograd' },
  { id: 'novi-sad', slug: 'novi-sad', name: 'Novi Sad' },
  { id: 'nis', slug: 'nis', name: 'Niš' },
  { id: 'kragujevac', slug: 'kragujevac', name: 'Kragujevac' },
  { id: 'cacak', slug: 'cacak', name: 'Čačak' },
  { id: 'kraljevo', slug: 'kraljevo', name: 'Kraljevo' },
  { id: 'subotica', slug: 'subotica', name: 'Subotica' },
  { id: 'pancevo', slug: 'pancevo', name: 'Pančevo' },
  { id: 'krusevac', slug: 'krusevac', name: 'Kruševac' },
  { id: 'leskovac', slug: 'leskovac', name: 'Leskovac' },
  { id: 'vranje', slug: 'vranje', name: 'Vranje' },
  { id: 'sabac', slug: 'sabac', name: 'Šabac' },
  { id: 'novi-pazar', slug: 'novi-pazar', name: 'Novi Pazar' },
  { id: 'uzice', slug: 'uzice', name: 'Užice' },
  { id: 'kopaonik', slug: 'kopaonik', name: 'Kopaonik' },
  { id: 'zlatibor', slug: 'zlatibor', name: 'Zlatibor' },
  { id: 'ostalo-u-srbiji', slug: 'ostalo-u-srbiji', name: 'Ostalo u Srbiji' },
  { id: 'rad-na-terenu', slug: 'rad-na-terenu', name: 'Rad na terenu' },
  // Region / Inostranstvo
  { id: 'nemacka', slug: 'nemacka', name: 'Nemačka' },
  { id: 'austrija', slug: 'austrija', name: 'Austrija' },
  { id: 'hrvatska', slug: 'hrvatska', name: 'Hrvatska' },
  { id: 'slovenija', slug: 'slovenija', name: 'Slovenija' },
  { id: 'crna-gora', slug: 'crna-gora', name: 'Crna Gora' },
  { id: 'svajcarska', slug: 'svajcarska', name: 'Švajcarska' },
  { id: 'ostalo-u-inostranstvu', slug: 'ostalo-u-inostranstvu', name: 'Ostalo u inostranstvu' },
];

export const SECTORS: TaxonomyItem[] = CORE_SECTORS;

export const PROFESSIONS: Record<string, TaxonomyItem[]> = {
  'gruba-gradnja': [
    { id: 'zidar', slug: 'zidar', name: 'Zidar', shortName: 'Zidar' },
    { id: 'tesar', slug: 'tesar', name: 'Tesar', shortName: 'Tesar' },
    { id: 'armirac', slug: 'armirac', name: 'Armirač', shortName: 'Armirač' },
    { id: 'univerzalac-majstor', slug: 'univerzalac-majstor', name: 'Univerzalac', shortName: 'Univerzalac' },
    { id: 'krovopokrivac', slug: 'krovopokrivac', name: 'Krovopokrivač', shortName: 'Krovopokrivač' },
    { id: 'betonirac', slug: 'betonirac', name: 'Betonirac', shortName: 'Betonirac' },
    { id: 'masinski-malter', slug: 'masinski-malter', name: 'Majstor za mašinski malter', shortName: 'Mašinski malter' },
    { id: 'fizicki-radnik', slug: 'fizicki-radnik', name: 'Fizički radnik', shortName: 'Fizički radnik' },
    { id: 'pomocni-radnik', slug: 'pomocni-radnik', name: 'Pomoćni radnik', shortName: 'Pomoćni radnik' },
  ],
  'rukovaoc-gradjevinskom-mehanizacijom': [
    { id: 'rukovalac-kranom', slug: 'rukovalac-kranom', name: 'Rukovalac kranom (Dizaličar)', shortName: 'Rukovalac kranom' },
    { id: 'rukovalac-bagerom', slug: 'rukovalac-bagerom', name: 'Rukovalac bagerom', shortName: 'Rukovalac bagerom' },
    { id: 'rukovalac-viljuskarom', slug: 'rukovalac-viljuskarom', name: 'Rukovalac viljuškarom', shortName: 'Rukovalac viljuškarom' },
    { id: 'rukovalac-telehenderom', slug: 'rukovalac-telehenderom', name: 'Rukovalac telehenderom', shortName: 'Rukovalac telehenderom' },
    { id: 'rukovalac-valjkom', slug: 'rukovalac-valjkom', name: 'Rukovalac valjkom', shortName: 'Rukovalac valjkom' },
    { id: 'rukovalac-finiserom', slug: 'rukovalac-finiserom', name: 'Rukovalac finišerom (Asfaltna baza)', shortName: 'Rukovalac finišerom' },
    { id: 'rukovalac-gradjevinskim-masinama', slug: 'rukovalac-gradjevinskim-masinama', name: 'Rukovalac građevinskim mašinama (Opšte)', shortName: 'Rukovalac mašinama' },
    { id: 'vozac-kamiona', slug: 'vozac-kamiona', name: 'Vozač kamiona / kipera / miksera', shortName: 'Vozač kamiona' },
    { id: 'dispecer-transporta', slug: 'dispecer-transporta', name: 'Dispečer / Koordinator transporta', shortName: 'Dispečer' },
  ],
  'zavrsni-radovi': [
    { id: 'moler', slug: 'moler', name: 'Moler', shortName: 'Moler' },
    { id: 'gipsar', slug: 'gipsar', name: 'Gipsar (Montažer suve gradnje)', shortName: 'Gipsar' },
    { id: 'fasader', slug: 'fasader', name: 'Fasader', shortName: 'Fasader' },
    { id: 'keramicar', slug: 'keramicar', name: 'Keramičar', shortName: 'Keramičar' },
    { id: 'parketar', slug: 'parketar', name: 'Parketar', shortName: 'Parketar' },
    { id: 'pvc-i-alu-stolar', slug: 'pvc-i-alu-stolar', name: 'PVC i ALU stolar', shortName: 'PVC i ALU stolar' },
    { id: 'majstor-za-listele', slug: 'majstor-za-listele', name: 'Majstor za listele', shortName: 'Majstor za listele' },
    { id: 'majstor-za-kosuljicu', slug: 'majstor-za-kosuljicu', name: 'Majstor za košuljicu', shortName: 'Majstor za košuljicu' },
    { id: 'majstor-za-ravnajuci-sloj', slug: 'majstor-za-ravnajuci-sloj', name: 'Majstor za ravnajući sloj', shortName: 'Majstor za ravnajući sloj' },
    { id: 'izolater', slug: 'izolater', name: 'Izolater (Termo/Hidro izolacija)', shortName: 'Izolater' },
    { id: 'podopolagac', slug: 'podopolagac', name: 'Podopolagač (Epoksidni podovi, linoleum)', shortName: 'Podopolagač' },
    { id: 'monter-kamena', slug: 'monter-kamena', name: 'Monter kamena', shortName: 'Monter kamena' },
    { id: 'fizicki-radnik', slug: 'fizicki-radnik', name: 'Fizički radnik', shortName: 'Fizički radnik' },
    { id: 'pomocni-radnik', slug: 'pomocni-radnik', name: 'Pomoćni radnik', shortName: 'Pomoćni radnik' },
  ],
  'instalacije-i-tehnika': [
    { id: 'vodoinstalater', slug: 'vodoinstalater', name: 'Vodoinstalater', shortName: 'Vodoinstalater' },
    { id: 'elektricar', slug: 'elektricar', name: 'Električar', shortName: 'Električar' },
    { id: 'elektroinstalater-slabe-struje', slug: 'elektroinstalater-slabe-struje', name: 'Elektroinstalater slabe struje (Alarmi, kamere, interfoni)', shortName: 'Elektroinstalater slabe struje' },
    { id: 'instalater-grejanja', slug: 'instalater-grejanja', name: 'Instalater grejanja (Centralno / podno)', shortName: 'Instalater grejanja' },
    { id: 'instalater-solarnih-panela', slug: 'instalater-solarnih-panela', name: 'Instalater solarnih panela', shortName: 'Instalater solarnih panela' },
    { id: 'instalater-protivpozarnih-sistema', slug: 'instalater-protivpozarnih-sistema', name: 'Instalater protivpožarnih sistema', shortName: 'Instalater protivpožarnih sistema' },
    { id: 'telekomunikacioni-instalater', slug: 'telekomunikacioni-instalater', name: 'Telekomunikacioni instalater (Optika, mreže)', shortName: 'Telekomunikacioni instalater' },
    { id: 'gasni-instalater', slug: 'gasni-instalater', name: 'Gasni instalater', shortName: 'Gasni instalater' },
    { id: 'tehnicar-pametnih-kuca', slug: 'tehnicar-pametnih-kuca', name: 'Tehničar pametnih kuća', shortName: 'Tehničar pametnih kuća' },
    { id: 'hvac-tehnicar', slug: 'hvac-tehnicar', name: 'HVAC tehničar (Klime, ventilacija)', shortName: 'HVAC tehničar' },
    { id: 'fizicki-radnik', slug: 'fizicki-radnik', name: 'Fizički radnik', shortName: 'Fizički radnik' },
    { id: 'pomocni-radnik', slug: 'pomocni-radnik', name: 'Pomoćni radnik', shortName: 'Pomoćni radnik' },
  ],
  'metal-i-bravarija': [
    { id: 'zavarivac', slug: 'zavarivac', name: 'Zavarivač (Varioc — Argon, REL, CO2)', shortName: 'Zavarivač' },
    { id: 'bravar', slug: 'bravar', name: 'Bravar (Građevinska bravarija)', shortName: 'Bravar' },
    { id: 'limar', slug: 'limar', name: 'Limar (Građevinski i krovni)', shortName: 'Limar' },
    { id: 'montazer-celicnih-konstrukcija', slug: 'montazer-celicnih-konstrukcija', name: 'Montažer čeličnih konstrukcija / Hala', shortName: 'Montažer konstrukcija' },
    { id: 'industrijski-monter', slug: 'industrijski-monter', name: 'Industrijski monter', shortName: 'Industrijski monter' },
    { id: 'antikorozista', slug: 'antikorozista', name: 'Antikorozista (Zaštita metala)', shortName: 'Antikorozista' },
    { id: 'peskirac', slug: 'peskirac', name: 'Peskirač', shortName: 'Peskirač' },
    { id: 'busac-betona', slug: 'busac-betona', name: 'Bušač betona (Dijamantsko sečenje)', shortName: 'Bušač betona' },
    { id: 'fizicki-radnik', slug: 'fizicki-radnik', name: 'Fizički radnik', shortName: 'Fizički radnik' },
    { id: 'pomocni-radnik', slug: 'pomocni-radnik', name: 'Pomoćni radnik', shortName: 'Pomoćni radnik' },
  ],
  'niskogradnja': [
    { id: 'asfalter', slug: 'asfalter', name: 'Asfalter', shortName: 'Asfalter' },
    { id: 'putar', slug: 'putar', name: 'Putar', shortName: 'Putar' },
    { id: 'cevopolagac', slug: 'cevopolagac', name: 'Cevopolagač (Voda, gas, kanalizacija)', shortName: 'Cevopolagač' },
    { id: 'betonac-za-puteve-i-tunele', slug: 'betonac-za-puteve-i-tunele', name: 'Betonac za puteve i tunele', shortName: 'Betonac' },
    { id: 'radnik-na-hidrogradnji', slug: 'radnik-na-hidrogradnji', name: 'Radnik na hidrogradnji (Melioracije, kanali, regulacija reka)', shortName: 'Radnik na hidrogradnji' },
    { id: 'geobusac', slug: 'geobusac', name: 'Geobušač / Radnik na šipovima', shortName: 'Geobušač' },
    { id: 'bunardzija', slug: 'bunardzija', name: 'Bunardžija', shortName: 'Bunardžija' },
    { id: 'radnik-na-niskogradnji', slug: 'radnik-na-niskogradnji', name: 'Radnik na niskogradnji (Opšte)', shortName: 'Radnik na niskogradnji' },
    { id: 'fizicki-radnik', slug: 'fizicki-radnik', name: 'Fizički radnik', shortName: 'Fizički radnik' },
    { id: 'pomocni-radnik', slug: 'pomocni-radnik', name: 'Pomoćni radnik', shortName: 'Pomoćni radnik' },
  ],
  'inzenjering': [
    { id: 'gradjevinski-inzenjer-visokogradnja', slug: 'gradjevinski-inzenjer-visokogradnja', name: 'Građevinski inženjer (Visokogradnja)', shortName: 'Građevinski inženjer' },
    { id: 'gradjevinski-inzenjer-niskogradnja', slug: 'gradjevinski-inzenjer-niskogradnja', name: 'Građevinski inženjer (Niskogradnja / Hidro)', shortName: 'Građevinski inženjer' },
    { id: 'arhitekta-projektant', slug: 'arhitekta-projektant', name: 'Arhitekta / Projektant', shortName: 'Arhitekta' },
    { id: 'geodeta-geometar', slug: 'geodeta-geometar', name: 'Geodeta / Geometar', shortName: 'Geodeta' },
    { id: 'sef-gradilista', slug: 'sef-gradilista', name: 'Šef gradilišta / Poslovođa', shortName: 'Šef gradilišta' },
    { id: 'projekt-menadzer', slug: 'projekt-menadzer', name: 'Projekt menadžer', shortName: 'Projekt menadžer' },
    { id: 'nadzorni-organ', slug: 'nadzorni-organ', name: 'Nadzorni organ', shortName: 'Nadzorni organ' },
    { id: 'saradnik-za-bzr', slug: 'saradnik-za-bzr', name: 'Saradnik za bezbednost i zdravlje na radu (BZR)', shortName: 'Saradnik za BZR' },
    { id: 'specijalista-za-rusenje', slug: 'specijalista-za-rusenje', name: 'Specijalista za rušenje objekata', shortName: 'Specijalista za rušenje' },
  ],
  'ostalo': [
    { id: 'fizicki-radnik', slug: 'fizicki-radnik', name: 'Fizički radnik', shortName: 'Fizički radnik' },
    { id: 'pomocni-radnik', slug: 'pomocni-radnik', name: 'Pomoćni radnik', shortName: 'Pomoćni radnik' },
    { id: 'cuvar-gradilista', slug: 'cuvar-gradilista', name: 'Čuvar gradilišta', shortName: 'Čuvar gradilišta' },
    { id: 'radnik-na-ciscenju', slug: 'radnik-na-ciscenju', name: 'Radnik na čišćenju nakon gradnje', shortName: 'Radnik na čišćenju' },
    { id: 'bastovan', slug: 'bastovan', name: 'Baštovan', shortName: 'Baštovan' },
  ],
};

// Deleted LOCATIONS here because it was moved above for consistency

export const PAYMENT_DYNAMICS: TaxonomyItem[] = [
  { id: 'dnevna', slug: 'dnevna', name: 'Dnevna isplata' },
  { id: 'nedeljna', slug: 'nedeljna', name: 'Nedeljna isplata' },
  { id: 'na-15-dana', slug: 'na-15-dana', name: 'Na 15 dana' },
  { id: 'mesecna', slug: 'mesecna', name: 'Mesečna isplata' },
  { id: 'po-m2', slug: 'po-m2', name: 'Po m2' },
];

export const BENEFITS: TaxonomyItem[] = [
  { id: 'smestaj', slug: 'smestaj', name: 'Smeštaj' },
  { id: 'prevoz', slug: 'prevoz', name: 'Prevoz do posla i nazad' },
  { id: 'topli-obrok', slug: 'topli-obrok', name: 'Hrana' },
  { id: 'pauza-za-kafu', slug: 'pauza-za-kafu', name: 'Pauza za kafu' },
  { id: 'htz-oprema', slug: 'htz-oprema', name: 'Radno odelo i HTZ' },
  { id: 'alat-za-rad', slug: 'alat-za-rad', name: 'Obezbeđen alat' },
  { id: 'prijava-ugovor', slug: 'prijava-ugovor', name: 'Prijava' },
  { id: 'placen-prekovremeni', slug: 'placen-prekovremeni', name: 'Plaćen prekovremeni rad' },
  { id: 'pomoc-pri-vizi', slug: 'pomoc-pri-vizi', name: 'Pomoć pri vizi / radnoj dozvoli' },
];

export const COMPANY_TYPES: TaxonomyItem[] = [
  { id: 'izvodjaci-radova', slug: 'izvodjaci-radova', name: 'Izvođači radova' },
  { id: 'iznajmljivanje-masina', slug: 'iznajmljivanje-masina', name: 'Iznajmljivanje mašina' },
  { id: 'smestaj-za-radnike', slug: 'smestaj-za-radnike', name: 'Smeštaj za radnike' },
  { id: 'ketering', slug: 'ketering', name: 'Ketering (Ishrana radnika)' },
  { id: 'inzenjering', slug: 'inzenjering', name: 'Inženjering i projektovanje' },
  { id: 'placevi', slug: 'placevi', name: 'Placevi i industrijske zone' },
];

export const ACCOMMODATION_TYPES: TaxonomyItem[] = [
  { id: 'radnicki-kontejneri', slug: 'radnicki-kontejneri', name: 'Radnički kontejneri / Kampovi', icon: 'house_siding' },
  { id: 'privatna-kuca', slug: 'privatna-kuca', name: 'Privatna kuća za ekipu', icon: 'home' },
  { id: 'stan-za-radnike', slug: 'stan-za-radnike', name: 'Stan za radnike', icon: 'apartment' },
  { id: 'pansion-hostel', slug: 'pansion-hostel', name: 'Pansion / Hostel', icon: 'hotel' },
  { id: 'motel', slug: 'motel', name: 'Motel', icon: 'night_shelter' },
];

export const ACCOMMODATION_AMENITIES: TaxonomyItem[] = [
  { id: 'parking-kamion', slug: 'parking-kamion', name: 'Parking za kamione', icon: 'local_shipping' },
  { id: 'parking-bager', slug: 'parking-bager', name: 'Parking za radne mašine', icon: 'construction' },
  { id: 'klima', slug: 'klima', name: 'Klimatizovano', icon: 'ac_unit' },
  { id: 'wifi', slug: 'wifi', name: 'Jak WiFi', icon: 'wifi' },
  { id: 'ves-masina', slug: 'ves-masina', name: 'Veš mašina', icon: 'local_laundry_service' },
  { id: 'susilica', slug: 'susilica', name: 'Industrijska sušilica', icon: 'mode_fan' },
  { id: 'kuhinja', slug: 'kuhinja', name: 'Opremljena kuhinja', icon: 'restaurant' },
  { id: 'dvoriste', slug: 'dvoriste', name: 'Ograđeno dvorište', icon: 'deck' },
  { id: 'wc-privatni', slug: 'wc-privatni', name: 'Privatno kupatilo u sobama', icon: 'shower' },
  { id: 'wc-zajednicki', slug: 'wc-zajednicki', name: 'Zajednička kupatila', icon: 'group' },
  { id: 'tv', slug: 'tv', name: 'TV / Zajednički boravak', icon: 'tv' },
  { id: 'grejanje', slug: 'grejanje', name: 'Centralno/Podno grejanje', icon: 'heat_pump' },
  { id: 'obezbedjenje', slug: 'obezbedjenje', name: 'Video nadzor / Obezbeđenje', icon: 'security' },
  { id: 'ciscenje-posteljina', slug: 'ciscenje-posteljina', name: 'Čišćenje i posteljina uključeni', icon: 'cleaning_services' },
  { id: 'blizina-autoputa', slug: 'blizina-autoputa', name: 'Blizina autoputa (<5km)', icon: 'add_road' },
];

export const KITCHEN_TYPES: TaxonomyItem[] = [
  { id: 'domaca', slug: 'domaca', name: 'Domaća' },
  { id: 'internacionalna', slug: 'internacionalna', name: 'Internacionalna' },
  { id: 'posna', slug: 'posna', name: 'Posna' },
  { id: 'kombinovano', slug: 'kombinovano', name: 'Kombinovano' },
];

export const REAL_ESTATE_PURPOSES: TaxonomyItem[] = [
  { id: 'građevinsko', slug: 'gradevinsko', name: 'Građevinsko' },
  { id: 'industrijsko', slug: 'industrijsko', name: 'Industrijsko' },
  { id: 'poljoprivredno', slug: 'poljoprivredno', name: 'Poljoprivredno' },
];

export const ACCESS_ROAD_TYPES: TaxonomyItem[] = [
  { id: 'asfalt', slug: 'asfalt', name: 'Asfalt (Teški teret)' },
  { id: 'tucanik', slug: 'tucanik', name: 'Tucanik' },
  { id: 'zemljani', slug: 'zemljani', name: 'Zemljani put' },
];

export const MARKETPLACE_CATEGORIES: TaxonomyItem[] = [
  { id: 'elektricni-alat', slug: 'elektricni-alat', name: 'Električni alat', icon: 'power' },
  { id: 'rucni-alat', slug: 'rucni-alat', name: 'Ručni alat', icon: 'build' },
  { id: 'oprema-skele-oplate', slug: 'oprema-skele-oplate', name: 'Oprema (skele, oplate)', icon: 'construction' },
  { id: 'htz-oprema', slug: 'htz-oprema', name: 'HTZ oprema', icon: 'dry_cleaning' },
  { id: 'rezervni-delovi', slug: 'rezervni-delovi', name: 'Rezervni delovi', icon: 'settings' },
  { id: 'ostalo', slug: 'ostalo', name: 'Ostalo', icon: 'more_horiz' },
];
