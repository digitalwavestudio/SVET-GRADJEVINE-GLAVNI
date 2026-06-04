import { CORE_SECTORS } from '@/src/constants/taxonomy';

// We map company categories to core sectors where they overlap
export const COMPANY_MAIN_CATEGORIES = CORE_SECTORS.map(s => ({
  id: s.id,
  name: s.name,
  icon: s.icon
})).concat([
  { id: 'specijalizovane', name: 'Specijalizovane usluge', icon: 'build_circle' }
]);

export const COMPANY_SUB_CATEGORIES: Record<string, string[]> = {
  'gruba-gradnja': [
    'Zemljani radovi i iskop', 'Temelji', 'Betoniranje', 'Zidanje (cigla, blok, kamen)', 
    'Armirački radovi', 'Tesarski radovi (oplata)', 'Krovne konstrukcije (drvene, čelične)', 
    'Montažne konstrukcije', 'Potporni zidovi', 'Rušenje i demontaža'
  ],
  'zavrsni-radovi': [
    'Fasade (termofasade, dekorativne)', 'Malterisanje i šrafiranje', 'Molersko-farbarski radovi', 
    'Keramičarski radovi', 'Podovi - parket', 'Podovi - laminat', 'Podovi - vinil', 
    'Podovi - epoksi / industrijski', 'Suva gradnja / knauf', 'Gipsani radovi', 
    'Spušteni plafoni', 'PVC stolarija', 'ALU stolarija', 'Drvena stolarija', 
    'Unutrašnja vrata', 'Krovopokrivanje - crep', 'Krovopokrivanje - lim', 
    'Krovopokrivanje - membrane', 'Limarski radovi', 'Staklarski radovi', 
    'Dekorativni kamen i obloge', 'Ograde, kapije i gelenderi'
  ],
  'instalacije-i-tehnika': [
    'Elektroinstalacije - jake struje', 'Elektroinstalacije - slabe struje (alarm, video nadzor, interfon)', 
    'Vodovod', 'Kanalizacija', 'Centralno grejanje', 'Podno grejanje', 'Klimatizacija', 
    'Ventilacija', 'Gasne instalacije', 'Solarni paneli', 'Toplotne pumpe', 
    'Smart home / automatizacija', 'Gromobranske instalacije', 'Protivpožarni sistemi', 
    'Liftovi i pokretne stepenice'
  ],
  'inzenjering': [
    'Arhitektonsko projektovanje', 'Konstruktivno projektovanje (statika)', 
    'Projektovanje elektroinstalacija', 'Projektovanje mašinskih instalacija (grejanje, klima)', 
    'Projektovanje vodovoda i kanalizacije', 'Saobraćajno projektovanje', 'Enterijer dizajn', 
    'Urbanizam i prostorno planiranje', 'Geodezija', 'Geomehanička ispitivanja', 
    'Tehnički nadzor', 'Energetska efikasnost / energetski pasoš', 
    'Građevinske dozvole i dokumentacija', 'Legalizacija objekata', 'BIM / 3D modelovanje', 
    'Procena vrednosti nekretnina', 'Veštačenje i ekspertize'
  ],
  'specijalizovane': [
    'Iznajmljivanje bagera', 'Iznajmljivanje kranova', 'Iznajmljivanje skela', 'Iznajmljivanje oplata',
    'Adaptacija stanova', 'Adaptacija poslovnih prostora', 'Renoviranje', 'Gradnja kuća "ključ u ruke"', 
    'Montažne kuće', 'Bazeni - izgradnja', 'Bazeni - oprema i održavanje', 'Wellness i spa', 
    'Hidroizolacija i sanacija vlage', 'Sanacija betona', 'Sanacija krovova', 'Čišćenje fasada', 
    'Landscaping', 'Asfaltiranje (dvorišta, prilazi)', 
    'Behaton', 'Bušenje bunara', 'Septičke jame', 
    'HTZ oprema', 'Protivpožarna zaštita', 'Čišćenje nakon gradnje'
  ],
  'metal-i-bravarija': [
    'Bravarski radovi', 'Zavarivanje', 'ALU i PVC bravarija', 'Montaža hala', 'Čelične konstrukcije'
  ],
  'niskogradnja': [
    'Asfaltiranje puteva', 'Putna signalizacija', 'Izgradnja mostova', 'Izgradnja tunela', 'Kanalizacione mreže'
  ]
};

export const COMPANY_EMPLOYEE_RANGES = [
  { id: '1-5', name: '1 - 5 zaposlenih' },
  { id: '6-15', name: '6 - 15 zaposlenih' },
  { id: '16-50', name: '16 - 50 zaposlenih' },
  { id: '51-200', name: '51 - 200 zaposlenih' },
  { id: '201+', name: 'Preko 200 zaposlenih' }
];
