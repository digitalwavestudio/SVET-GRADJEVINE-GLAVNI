import { BENEFITS, LOCATIONS, PAYMENT_DYNAMICS, PROFESSIONS } from '@/src/constants/taxonomy';

export const AI_AD_DESCRIPTION_TEMPERATURE = 0.6;

export interface JobAdPromptInput {
  profession?: string;
  sector?: string;
  location?: string;
  plataMin?: string | number;
  plataMax?: string | number;
  salaryType?: string;
  dinamikaIsplate?: string;
  isNegotiable?: boolean;
  benefits?: unknown;
  contactPhone?: string;
  userText?: string;
  styleIndex?: number;
}

interface AdPromptStyle {
  id: string;
  instructions: string;
}

const AD_PROMPT_STYLES: AdPromptStyle[] = [
  {
    id: 'direktan',
    instructions: 'Struktura: snažan uvod od dve rečenice, zatim uslovi, zatim zahtevi, pa kratak poziv na prijavu.',
  },
  {
    id: 'iskustvo',
    instructions: 'Struktura: prvo opiši radni dan i ekipu, zatim konkretne uslove, pa zahteve i prijavu.',
  },
  {
    id: 'klasican-seo',
    instructions: 'Struktura: SEO uvod sa profesijom, lokacijom i platom, zatim pregledne nabrojane celine i poziv na prijavu.',
  },
  {
    id: 'pitanja-i-odgovori',
    instructions: 'Struktura: otvori pitanjem koje muči radnika, zatim odgovori kroz uslove, zahteve i prijavu.',
  },
];

function findProfessionName(profession?: string, sector?: string): string {
  if (!profession && sector) {
    return String(sector).replace(/-/g, ' ');
  }
  if (!profession) return '';
  const all = Object.values(PROFESSIONS).flat();
  const match = (sector ? PROFESSIONS[sector] || [] : all).find((item) => item.slug === profession || item.id === profession)
    || all.find((item) => item.slug === profession || item.id === profession);
  if (match?.name) return match.name.split(' (')[0];
  return String(profession).replace(/-/g, ' ');
}

function findLocationName(location?: string): string {
  if (!location) return '';
  const match = LOCATIONS.find((item) => item.slug === location || item.id === location || item.name === location);
  return match?.name || String(location).replace(/-/g, ' ');
}

function findPaymentName(dinamikaIsplate?: string, salaryType?: string): string {
  const slug = dinamikaIsplate || salaryType || '';
  if (!slug) return '';
  const match = PAYMENT_DYNAMICS.find((item) => item.slug === slug || item.id === slug);
  return match?.name || String(slug).replace(/-/g, ' ');
}

function findBenefitNames(benefits: unknown): string[] {
  if (!Array.isArray(benefits)) return [];
  return benefits
    .map((benefit) => {
      if (typeof benefit !== 'string') return '';
      const slug = benefit.trim();
      const match = BENEFITS.find((item) => item.slug === slug || item.id === slug);
      return match?.name || slug.replace(/-/g, ' ').trim();
    })
    .filter((name, index, all) => name && all.indexOf(name) === index);
}

export function buildJobAdPrompt(input: JobAdPromptInput): string {
  const profession = findProfessionName(input.profession, input.sector);
  const location = findLocationName(input.location);
  const payment = findPaymentName(input.dinamikaIsplate, input.salaryType);
  const benefits = findBenefitNames(input.benefits);
  const salary = input.isNegotiable
    ? 'Po dogovoru'
    : [input.plataMin, input.plataMax].filter((value) => value !== undefined && value !== null && String(value).trim() !== '').join(' - ');
  const style = AD_PROMPT_STYLES[
    typeof input.styleIndex === 'number' && input.styleIndex >= 0
      ? input.styleIndex % AD_PROMPT_STYLES.length
      : Math.floor(Math.random() * AD_PROMPT_STYLES.length)
  ];

  const facts = [
    profession ? `Pozicija: ${profession}` : '',
    location ? `Lokacija: ${location}` : '',
    salary ? `Zarada: ${salary}${payment ? `, isplata: ${payment}` : ''}` : payment ? `Isplata: ${payment}` : '',
    benefits.length > 0 ? `Benefiti: ${benefits.join(', ')}` : '',
    input.contactPhone ? `Telefon: ${input.contactPhone}` : '',
  ].filter(Boolean);

  return `Napiši jedinstven oglas za posao na srpskom jeziku, latinica, 180-300 reči.

ČINJENICE KOJE SMEŠ DA KORISTIŠ:
${facts.map((fact) => `- ${fact}`).join('\n') || '- Nema dodatnih činjenica osim korisnikovog teksta.'}

KORISNIKOV TEKST:
${input.userText?.trim() || 'Nema dodatnog teksta.'}

STIL OGLASA:
${style.instructions}

STROGA SEO I TAČNOST PRAVILA:
1. Koristi samo navedene činjenice. Ne izmišljaj platu, smeštaj, prevoz, hranu, radno vreme, telefon ili lokaciju.
2. Ako neki podatak nedostaje, jednostavno ga nemoj spomenuti. Zabranjen je znak pitanja kao popuna.
3. Ključne reči profesija, lokacija i plata moraju prirodno da stoje u prve dve rečenice.
4. Koristi samo navedenu lokaciju. Ne dodaj druge gradove, okolna mesta ili države.
5. Običan tekst, bez markdowna, bez zvezdica, bez naslova i bez uvodnih fraza.
6. Zabranjene su generičke fraze: dinamično okruženje, konkurentna plata, odlična prilika, mladi tim.
7. Završi jednom prirodnom rečenicom sa pozivom na prijavu, bez ponavljanja istog obrasca.`;
}
