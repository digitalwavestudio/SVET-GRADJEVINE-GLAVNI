export interface ListingItem {
  id: string;
  title: string;
  location: string;
  loc?: string;
  salary: string;
  plataMin?: number;
  plataMax?: number;
  salaryType?: string;
  company: string;
  companyName?: string;
  comp?: string;
  description: string;
  isPremium: boolean;
  isUrgent: boolean;
  createdAt: string;
  logo?: string;
  logoPlaceholder?: string;
}

export interface AiResponse {
  answer: string;
  parsedIntent?: {
    vertikala: string;
    zanimanje: string;
    lokacija: string;
    tipPosla: string;
  };
  confidence?: number;
  count: number;
  listings?: ListingItem[];
}

export function extractIntent(query: string, listings: ListingItem[]) {
  const q = query.toLowerCase();
  let lokacija = '';
  let zanimanje = '';

  const gradovi = ['beograd', 'nis', 'niš', 'novi sad', 'novi-sad', 'subotica', 'kragujevac', 'krusevac', 'kruševac', 'cacak', 'čačak', 'valjevo', 'nemačka', 'nemacka', 'hrvatska', 'slovenija', 'zlatibor'];
  for (const g of gradovi) {
    if (q.includes(g)) {
      lokacija = g.charAt(0).toUpperCase() + g.slice(1);
      if (lokacija === 'Nis') lokacija = 'Niš';
      if (lokacija === 'Nemacka') lokacija = 'Nemačka';
      if (lokacija === 'Novi sad') lokacija = 'Novi Sad';
      break;
    }
  }

  if (!lokacija && listings.length > 0) {
    const locs = listings.map(l => l.location).filter(Boolean);
    if (locs.length > 0) {
      const mostCommon = locs.sort((a,b) =>
        locs.filter(v => v===a).length - locs.filter(v => v===b).length
      ).pop();
      lokacija = mostCommon || 'Srbija';
    } else {
      lokacija = 'Srbija';
    }
  } else if (!lokacija) {
    lokacija = 'Srbija';
  }

  const zanimanja = ['tesar', 'armirač', 'armirac', 'zidar', 'moler', 'fasader', 'keramicar', 'keramičar', 'vodoinstalater', 'električar', 'elektricar', 'krovopokrivač', 'krovopokrivac', 'rukovalac', 'bravar', 'stolar', 'gipsar'];
  for (const z of zanimanja) {
    if (q.includes(z)) {
      zanimanje = z.charAt(0).toUpperCase() + z.slice(1);
      if (zanimanje === 'Armirac') zanimanje = 'Armirač';
      if (zanimanje === 'Keramicar') zanimanje = 'Keramičar';
      if (zanimanje === 'Elektricar') zanimanje = 'Električar';
      break;
    }
  }

  if (!zanimanje && listings.length > 0) {
    const firstTitle = listings[0].title;
    zanimanje = firstTitle.split('—')[0]?.split('-')[0]?.trim() || firstTitle.split(' ')[0];
  }

  return {
    vertical: 'Poslovi',
    profession: zanimanje || 'Građevinski radnik',
    location: lokacija
  };
}

export function extractStats(listings: ListingItem[]) {
  if (listings.length === 0) {
    return { locations: 'Nema', rates: 'Nema', professions: 'Nema' };
  }

  const locs = Array.from(new Set(listings.map(l => l.location).filter(Boolean)));
  const locationsStr = locs.slice(0, 3).join(', ') + (locs.length > 3 ? '...' : '');

  let minRate = Infinity;
  let maxRate = -Infinity;
  let currency = '€/h';

  listings.forEach(l => {
    if (!l.salary) return;
    const matches = l.salary.match(/\d+/g);
    if (matches) {
      matches.forEach(numStr => {
        const num = parseInt(numStr, 10);
        if (num > 0 && num < 100) {
          if (num < minRate) minRate = num;
          if (num > maxRate) maxRate = num;
        }
      });
    }
  });

  const ratesStr = minRate !== Infinity && maxRate !== -Infinity
    ? `${minRate}–${maxRate} ${currency}`
    : 'Dogovor';

  const titles = Array.from(new Set(listings.map(l => l.title.split('—')[0]?.split('-')[0]?.trim() || l.title.split(' ')[0]).filter(Boolean)));
  const professionsStr = titles.slice(0, 3).join(', ') + (titles.length > 3 ? '...' : '');

  return {
    locations: locationsStr,
    rates: ratesStr,
    professions: professionsStr
  };
}

export function applyBoldRules(text: string, options: { detailed?: boolean } = {}) {
  if (options.detailed) {
    return applyDetailedBoldRules(text);
  }

  let parsed = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white tracking-wide">$1</strong>');
  parsed = parsed.replace(/\*/g, '');

  parsed = parsed.replace(/(\b\d+[-–]\d+\s*(?:evra|€|eur)\b)/gi, '<strong class="font-bold text-secondary tracking-wide">$1</strong>');
  parsed = parsed.replace(/(satnicom|satnic[a-z]*)/gi, '<strong class="font-bold text-secondary">$1</strong>');
  parsed = parsed.replace(/(smeštaj[a-z]*|smestaj[a-z]*|obrok[a-z]*|hran[a-z]*|prevoz[a-z]*|viz[a-z]*|radn[a-z]* dozvol[a-z]*|dokumentacij[a-z]*)/gi, '<strong class="font-bold text-white">$1</strong>');
  parsed = parsed.replace(/(\b(?:Srbija|Sloveniji|Slovenija|Hrvatskoj|Hrvatska|Nemačkoj|Nemačka|Austrija|Beogradu|Beograd|Borča|Zlatiboru|Zlatibor|Negotinu|Negotin|Sremskoj\s+Mitrovici|Sremska\s+Mitrovica|Subotici|Subotica|Nišu|Niš|Hvaru|Hvar|Splitu|Split|Zagrebu|Zagreb|Novi\s+Sad|Kragujevac|Kruševac|Zrenjanin|Inostranstvu|Inostranstvo)\b)/gi, '<strong class="font-bold text-white tracking-wide">$1</strong>');

  return parsed;
}

function applyDetailedBoldRules(text: string) {
  let parsed = text.replace(/\*\*(.*?)\*\*/g, (_, content) => {
    if (/\b(?:Srbij[iaue]|Slovenij[iaue]|Hrvatsk[oiaeu]|Nemačk[oiaeu]|Austrij[iaue]|Beograd[ua]?|Borč[iau]?|Zlatibor[ua]?|Negotin[au]?|Subotic[iau]?|Niš[ua]?|Hvar[ua]?|Split[ua]?|Zagreb[au]?|Kragujevac[au]?|Kruševac[au]?|Zrenjanin[au]?|Sremsk[aeiou]\s+Mitrovic[aeiou]?|Nov[iom]?\s+Sad[ua]?|Pančev[oau]?|Pancev[oau]?|Inostranstv[ou]|Inostranstva|Crn[aeiou]\s+Gor[aeiou]?|Bosn[aeiou]?|Makedonij[iaue]?|Rumunij[iaue]?|Mađarsk[aeiou]?|Madarsk[aeiou]?|Bugarsk[aeiou]?)\b/i.test(content)) {
      return `<strong class="font-bold text-white tracking-wide">${content}</strong>`;
    }
    if (/\d+[.,]?\d*\s*(?:€|eur|evra)/i.test(content)) {
      return `<strong class="font-bold text-secondary tracking-wide">${content}</strong>`;
    }
    if (/(smeštaj|smestaj|obrok|hrana|prevoz|viz|radn[a-z]* dozvol|dokumentacija|radn[a-z]* oprema|alat|oprema)/i.test(content)) {
      return `<strong class="font-bold text-white">${content}</strong>`;
    }
    if (/(satnica|plata)/i.test(content)) {
      return `<strong class="font-bold text-secondary">${content}</strong>`;
    }
    return `<strong class="font-bold text-white tracking-wide">${content}</strong>`;
  });
  parsed = parsed.replace(/\*/g, '');
  parsed = parsed.replace(/(\b(?:Srbij[iaue]|Slovenij[iaue]|Hrvatsk[oiaeu]|Nemačk[oiaeu]|Austrij[iaue]|Beograd[ua]?|Borč[iau]?|Zlatibor[ua]?|Negotin[au]?|Subotic[iau]?|Niš[ua]?|Hvar[ua]?|Split[ua]?|Zagreb[au]?|Kragujevac[au]?|Kruševac[au]?|Zrenjanin[au]?|Sremsk[aeiou]\s+Mitrovic[aeiou]?|Nov[iom]?\s+Sad[ua]?|Pančev[oau]?|Pancev[oau]?|Inostranstv[ou]|Inostranstva|Crn[aeiou]\s+Gor[aeiou]?|Bosn[aeiou]?|Makedonij[iaue]?|Rumunij[iaue]?|Mađarsk[aeiou]?|Madarsk[aeiou]?|Bugarsk[aeiou]?)\b)/gi, '<strong class="font-bold text-white tracking-wide">$1</strong>');
  parsed = parsed.replace(/(smeštaj[a-z]*|smestaj[a-z]*|obrok[a-z]*|hran[a-z]*|prevoz[a-z]*|viz[a-z]*|radn[a-z]* dozvol[a-z]*|dokumentacij[a-z]*|radn[a-z]* oprem[a-z]*|alata?|oprem[a-z]*)/gi, '<strong class="font-bold text-white">$1</strong>');
  parsed = parsed.replace(/(\b\d+\s*oglas[aeiou]\b)/gi, '<strong class="font-bold text-white">$1</strong>');
  parsed = parsed.replace(/(\b\d+[.,]\d+\s*[-–]\s*\d+[.,]\d+\s*(?:€|eur|evra)?\b)/gi, '<strong class="font-bold text-secondary tracking-wide">$1</strong>');
  parsed = parsed.replace(/(\b\d+\s*[-–]\s*\d+\s*(?:€|eur|evra)\b)/gi, '<strong class="font-bold text-secondary tracking-wide">$1</strong>');
  parsed = parsed.replace(/(\b\d+[.,]?\d*\s*(?:€|eur|evra)\b)/gi, '<strong class="font-bold text-secondary tracking-wide">$1</strong>');
  parsed = parsed.replace(/za posao (\w+)/gi, 'za posao <strong class="font-bold text-white uppercase tracking-wide">$1</strong>');
  parsed = parsed.replace(/ZA '(\w+)' PO LOKACIJAMA/gi, "ZA '<strong class=\"font-bold text-white uppercase tracking-wide\">$1</strong>' PO LOKACIJAMA");
  return parsed;
}
