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
  { id: 'metal-i-bravarija', slug: 'metal-i-bravarija', name: 'Metal i bravarija', icon: 'build' },
  { id: 'niskogradnja', slug: 'niskogradnja', name: 'Niskogradnja', icon: 'add_road' },
  { id: 'inzenjering', slug: 'inzenjering', name: 'Inženjering i projektovanje', icon: 'architecture' },
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
    { id: 'tesar', slug: 'tesar', name: 'Tesar (Opšti, šalovanje, konstrukcije)', shortName: 'Tesar' },
    { id: 'armirac', slug: 'armirac', name: 'Armirač', shortName: 'Armirač' },
    { id: 'betonirac', slug: 'betonirac', name: 'Betonirac', shortName: 'Betonirac' },
    { id: 'gradjevinski-radnik-fizicki', slug: 'gradjevinski-radnik-fizicki', name: 'Građevinski radnik (Fizički)', shortName: 'Građevinski radnik' },
    { id: 'pomocni-radnik', slug: 'pomocni-radnik', name: 'Pomoćni radnik', shortName: 'Pomoćni radnik' },
    { id: 'miner-radnik-na-iskopu', slug: 'miner-radnik-na-iskopu', name: 'Miner / Radnik na iskopu', shortName: 'Miner' },
    { id: 'rukovalac-kranom', slug: 'rukovalac-kranom', name: 'Rukovalac kranom (Dizaličar)', shortName: 'Rukovalac kranom' },
    { id: 'rukovalac-bagerom', slug: 'rukovalac-bagerom', name: 'Rukovalac bagerom', shortName: 'Rukovalac bagerom' },
    { id: 'rukovalac-viljuskarom', slug: 'rukovalac-viljuskarom', name: 'Rukovalac viljuškarom', shortName: 'Rukovalac viljuškarom' },
    { id: 'rukovalac-telehenderom', slug: 'rukovalac-telehenderom', name: 'Rukovalac telehenderom', shortName: 'Rukovalac telehenderom' },
    { id: 'rukovalac-valjkom', slug: 'rukovalac-valjkom', name: 'Rukovalac valjkom', shortName: 'Rukovalac valjkom' },
    { id: 'operator-gradjevinskih-masina', slug: 'operator-gradjevinskih-masina', name: 'Operator građevinskih mašina (Opšte)', shortName: 'Operator mašina' },
  ],
  'zavrsni-radovi': [
    { id: 'moler-farbar', slug: 'moler-farbar', name: 'Moler / Farbar', shortName: 'Moler' },
    { id: 'gipsar', slug: 'gipsar', name: 'Gipsar (Montažer suve gradnje)', shortName: 'Gipsar' },
    { id: 'keramicar', slug: 'keramicar', name: 'Keramičar', shortName: 'Keramičar' },
    { id: 'parketar', slug: 'parketar', name: 'Parketar', shortName: 'Parketar' },
    { id: 'laminater', slug: 'laminater', name: 'Laminater', shortName: 'Laminater' },
    { id: 'podopolagac', slug: 'podopolagac', name: 'Podopolagač (Epoksidni podovi, linoleum)', shortName: 'Podopolagač' },
    { id: 'fasader', slug: 'fasader', name: 'Fasader', shortName: 'Fasader' },
    { id: 'stolar', slug: 'stolar', name: 'Stolar (Unutrašnja stolarija i nameštaj)', shortName: 'Stolar' },
    { id: 'kamenorezac', slug: 'kamenorezac', name: 'Kamenorezac / Monter kamena', shortName: 'Kamenorezac' },
    { id: 'staklorezac', slug: 'staklorezac', name: 'Staklorezac / Monter stakla', shortName: 'Staklorezac' },
    { id: 'dekorater-enterijera', slug: 'dekorater-enterijera', name: 'Dekorater enterijera', shortName: 'Dekorater' },
    { id: 'tapetar', slug: 'tapetar', name: 'Tapetar (Zidne obloge)', shortName: 'Tapetar' },
  ],
  'instalacije-i-tehnika': [
    { id: 'vodoinstalater', slug: 'vodoinstalater', name: 'Vodoinstalater', shortName: 'Vodoinstalater' },
    { id: 'kanalizacioni-majstor', slug: 'kanalizacioni-majstor', name: 'Kanalizacioni majstor (Kanalac)', shortName: 'Kanalizacioni majstor' },
    { id: 'elektricar', slug: 'elektricar', name: 'Električar (Instalater jake struje)', shortName: 'Električar' },
    { id: 'elektroinstalater-slabe-struje', slug: 'elektroinstalater-slabe-struje', name: 'Elektroinstalater slabe struje (Alarmi, video nadzor)', shortName: 'Instalater slabe struje' },
    { id: 'telekomunikacioni-instalater', slug: 'telekomunikacioni-instalater', name: 'Telekomunikacioni instalater (Optika, mreže)', shortName: 'Telekomunikacioni instalater' },
    { id: 'instalater-grejanja', slug: 'instalater-grejanja', name: 'Instalater grejanja (Centralno / podno)', shortName: 'Instalater grejanja' },
    { id: 'gasni-instalater', slug: 'gasni-instalater', name: 'Gasni instalater', shortName: 'Gasni instalater' },
    { id: 'hvac-tehnicar', slug: 'hvac-tehnicar', name: 'HVAC tehničar (Klime, ventilacija)', shortName: 'HVAC tehničar' },
    { id: 'instalater-toplotnih-pumpi', slug: 'instalater-toplotnih-pumpi', name: 'Instalater toplotnih pumpi', shortName: 'Instalater toplotnih pumpi' },
    { id: 'instalater-solarnih-panela', slug: 'instalater-solarnih-panela', name: 'Instalater solarnih panela', shortName: 'Instalater solarnih panela' },
    { id: 'serviser-liftova', slug: 'serviser-liftova', name: 'Serviser liftova', shortName: 'Serviser liftova' },
    { id: 'tehnicar-pametnih-kuca', slug: 'tehnicar-pametnih-kuca', name: 'Tehničar pametnih kuća', shortName: 'Tehničar pametnih kuća' },
    { id: 'instalater-protivpozarnih-sistema', slug: 'instalater-protivpozarnih-sistema', name: 'Instalater protivpožarnih sistema', shortName: 'Instalater protivpožarnih sistema' },
    { id: 'bazenski-tehnicar', slug: 'bazenski-tehnicar', name: 'Bazenski tehničar (Instalacija bazena)', shortName: 'Bazenski tehničar' },
  ],
  'metal-i-bravarija': [
    { id: 'zavarivac', slug: 'zavarivac', name: 'Zavarivač (Varioc — Argon, REL, CO2)', shortName: 'Zavarivač' },
    { id: 'bravar', slug: 'bravar', name: 'Bravar (Građevinska bravarija)', shortName: 'Bravar' },
    { id: 'limar', slug: 'limar', name: 'Limar (Građevinski i krovni)', shortName: 'Limar' },
    { id: 'alu-i-pvc-stolar', slug: 'alu-i-pvc-stolar', name: 'ALU i PVC stolar / Monter stolarije', shortName: 'ALU i PVC stolar' },
    { id: 'montazer-celicnih-konstrukcija', slug: 'montazer-celicnih-konstrukcija', name: 'Montažer čeličnih konstrukcija / Hala', shortName: 'Montažer konstrukcija' },
    { id: 'industrijski-monter', slug: 'industrijski-monter', name: 'Industrijski monter', shortName: 'Industrijski monter' },
    { id: 'radnik-na-visini', slug: 'radnik-na-visini', name: 'Radnik na visini (Industrijski alpinista)', shortName: 'Radnik na visini' },
    { id: 'secar-busac-betona', slug: 'secar-busac-betona', name: 'Sečar / Bušač betona (Dijamantsko sečenje)', shortName: 'Sečar betona' },
    { id: 'peskirac', slug: 'peskirac', name: 'Peskirač', shortName: 'Peskirač' },
    { id: 'antikorozista', slug: 'antikorozista', name: 'Antikorozista (Zaštita metala)', shortName: 'Antikorozista' },
  ],
  'niskogradnja': [
    { id: 'asfalter', slug: 'asfalter', name: 'Asfalter', shortName: 'Asfalter' },
    { id: 'putar', slug: 'putar', name: 'Putar', shortName: 'Putar' },
    { id: 'radnik-na-niskogradnji', slug: 'radnik-na-niskogradnji', name: 'Radnik na niskogradnji (Opšte)', shortName: 'Radnik na niskogradnji' },
    { id: 'cevopolagac', slug: 'cevopolagac', name: 'Cevopolagač (Voda, gas, kanalizacija)', shortName: 'Cevopolagač' },
    { id: 'betonac-za-puteve-i-tunele', slug: 'betonac-za-puteve-i-tunele', name: 'Betonac za puteve i tunele', shortName: 'Betonac' },
    { id: 'masinista-za-asfaltnu-bazu', slug: 'masinista-za-asfaltnu-bazu', name: 'Mašinista za asfaltnu bazu / Finišer', shortName: 'Mašinista' },
    { id: 'radnik-na-mostovima', slug: 'radnik-na-mostovima', name: 'Radnik na mostovima', shortName: 'Radnik na mostovima' },
    { id: 'radnik-na-tunelima', slug: 'radnik-na-tunelima', name: 'Radnik na tunelima', shortName: 'Radnik na tunelima' },
    { id: 'geobusac', slug: 'geobusac', name: 'Geobušač / Radnik na šipovima', shortName: 'Geobušač' },
    { id: 'bunardzija', slug: 'bunardzija', name: 'Bunardžija', shortName: 'Bunardžija' },
    { id: 'putar-signalizacija', slug: 'putar-signalizacija', name: 'Putar — signalizacija (Obeležavanje puteva)', shortName: 'Putar (signalizacija)' },
  ],
  'inzenjering': [
    { id: 'gradjevinski-inzenjer-visokogradnja', slug: 'gradjevinski-inzenjer-visokogradnja', name: 'Građevinski inženjer (Visokogradnja)', shortName: 'Građevinski inženjer' },
    { id: 'gradjevinski-inzenjer-niskogradnja', slug: 'gradjevinski-inzenjer-niskogradnja', name: 'Građevinski inženjer (Niskogradnja / Hidro)', shortName: 'Građevinski inženjer' },
    { id: 'arhitekta-projektant', slug: 'arhitekta-projektant', name: 'Arhitekta / Projektant', shortName: 'Arhitekta' },
    { id: 'geodeta-geometar', slug: 'geodeta-geometar', name: 'Geodeta / Geometar', shortName: 'Geodeta' },
    { id: 'sef-gradilista', slug: 'sef-gradilista', name: 'Šef gradilišta / Poslovođa', shortName: 'Šef gradilišta' },
    { id: 'projekt-menadzer', slug: 'projekt-menadzer', name: 'Projekt menadžer', shortName: 'Projekt menadžer' },
    { id: 'nadzorni-organ', slug: 'nadzorni-organ', name: 'Nadzorni organ', shortName: 'Nadzorni organ' },
    { id: 'procenitelj-troskova', slug: 'procenitelj-troskova', name: 'Procenitelj troškova (Inženjer za tendere)', shortName: 'Procenitelj troškova' },
    { id: 'saradnik-za-bzr', slug: 'saradnik-za-bzr', name: 'Saradnik za bezbednost i zdravlje na radu (BZR)', shortName: 'Saradnik za BZR' },
    { id: 'cuvar-gradilista', slug: 'cuvar-gradilista', name: 'Čuvar gradilišta', shortName: 'Čuvar gradilišta' },
    { id: 'bastovan-pejzazni-arhitekta', slug: 'bastovan-pejzazni-arhitekta', name: 'Baštovan / Pejzažni arhitekta', shortName: 'Pejzažni arhitekta' },
    { id: 'specijalista-za-rusenje', slug: 'specijalista-za-rusenje', name: 'Specijalista za rušenje objekata', shortName: 'Specijalista za rušenje' },
    { id: 'radnik-na-ciscenju', slug: 'radnik-na-ciscenju', name: 'Radnik na čišćenju nakon gradnje', shortName: 'Radnik na čišćenju' },
  ],
};

// Deleted LOCATIONS here because it was moved above for consistency

export const EXPERIENCE_LEVELS: TaxonomyItem[] = [
  { id: 'bez-iskustva', slug: 'bez-iskustva', name: 'Može i bez iskustva' },
  { id: 'potrebno-iskustvo', slug: 'potrebno-iskustvo', name: 'Potrebno iskustvo' },
];

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

export const ENGAGEMENT_TYPES: TaxonomyItem[] = [
  { id: '8-16', slug: '8-16', name: '8-16' },
  { id: '7-17', slug: '7-17', name: '7 do 17' },
  { id: 'puno-radno-vreme', slug: 'puno-radno-vreme', name: 'Puno radno vreme' },
  { id: 'upisi', slug: 'upisi', name: 'Upis' },
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
