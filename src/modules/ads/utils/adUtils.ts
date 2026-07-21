import { PROFESSIONS, LOCATIONS, ACCOMMODATION_TYPES, KITCHEN_TYPES, REAL_ESTATE_PURPOSES, SECTORS } from "@/src/constants/taxonomy";
import { MACHINE_SUBCATEGORIES } from "@/src/constants/machineTaxonomy";
import { 
  jobSchema, 
  realEstateSchema, businessProfileSchema as companySchema 
} from '@svet-gradjevine/shared';

const COUNTRY_KEYWORDS: Record<string, string> = {
  'njemacka': 'Berlin',
  'njemačka': 'Berlin',
  'deutschland': 'Berlin',
  'germany': 'Berlin',
};

export function extractLocation(text: string): string | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const loc of LOCATIONS) {
    const cityLower = loc.name.toLowerCase();
    const patterns = [
      new RegExp(`\\b(?:u|na|iz)\\s+${cityLower}\\b`, 'i'),
      new RegExp(`\\b${cityLower}a\\b`, 'i'),
      new RegExp(`\\b${cityLower}u\\b`, 'i'),
      new RegExp(`\\b${cityLower}e\\b`, 'i'),
      new RegExp(`\\b${cityLower}i\\b`, 'i'),
      new RegExp(`\\b${cityLower}om\\b`, 'i'),
      new RegExp(`\\b${cityLower}\\b`, 'i'),
    ];
    if (patterns.some(p => p.test(lower))) return loc.name;
  }
  for (const [keyword, city] of Object.entries(COUNTRY_KEYWORDS)) {
    if (lower.includes(keyword)) return city;
    const stem = keyword.slice(0, -1);
    if (stem.length >= 5 && lower.includes(stem)) return city;
  }
  return null;
}

const PROFESSION_KEYWORDS: Record<string, { id: string; sector: string }> = {
  'hidroizolacija': { id: 'hidroizolater', sector: 'zavrsni-radovi' },
  'termoizolacija': { id: 'izolater', sector: 'zavrsni-radovi' },
};

export function extractProfession(text: string): { id: string; sector: string } | null {
  if (!text) return null;
  const normal = (s: string) => s.toLowerCase().replace(/š/g, 's').replace(/đ/g, 'dj').replace(/č/g, 'c').replace(/ć/g, 'c').replace(/ž/g, 'z');
  const normalized = normal(text);
  for (const [keyword, prof] of Object.entries(PROFESSION_KEYWORDS)) {
    if (normalized.includes(keyword)) return prof;
  }
  for (const [sector, items] of Object.entries(PROFESSIONS)) {
    for (const item of items) {
      for (const name of [item.name, item.shortName]) {
        if (!name) continue;
        const n = normal(name);
        if (n.length < 3) continue;
        const variants = [n, n + 'a', n + 'u', n + 'e', n + 'i', n + 'om'];
        for (const v of variants) {
          const idx = normalized.indexOf(v);
          if (idx === -1) continue;
          const before = normalized[idx - 1] || ' ';
          const after = normalized[idx + v.length] || ' ';
          if (!/[a-z0-9]/.test(before) && !/[a-z0-9]/.test(after)) {
            return { id: item.id, sector };
          }
        }
      }
      // Fallback: proveri substringove imena (hvata "instalater" u "vodeoinstalateri")
      for (const name of [item.name, item.shortName]) {
        if (!name) continue;
        const n = normal(name);
        if (n.length < 8) continue;
        for (let start = 0; start <= n.length - 6; start++) {
          const sub = n.substring(start, start + 6);
          if (sub.length < 6) continue;
          const idx = normalized.indexOf(sub);
          if (idx === -1) continue;
          const before = normalized[idx - 1] || ' ';
          const after = normalized[idx + sub.length] || ' ';
          if (!/[a-z0-9]/.test(before) && !/[a-z0-9]/.test(after)) {
            return { id: item.id, sector };
          }
        }
      }
    }
  }
  return null;
}

export const getValidationSchema = (category: string | null) => {
  switch (category) {
    case 'job': return jobSchema;
    case 'plot': return realEstateSchema;
    case 'company': return companySchema;
    default: return null;
  }
};

export const getProfessionName = (formData: Record<string, any>, selectedCategory: string | null) => {
  if (selectedCategory === "accommodation") return formData.accTitle || "";
  if (selectedCategory === "catering") return formData.catTitle || "";
  if (!formData.sector || !formData.profession) return "";
  const prof = PROFESSIONS[formData.sector]?.find(
    (p) => p.slug === formData.profession,
  );
  if (prof) return prof.name.split(" (")[0];
  // Fallback to capitalizing the raw profession string
  return formData.profession.charAt(0).toUpperCase() + formData.profession.slice(1);
};

export const getLocationName = (location: string) => {
  if (!location) return "";
  const loc = LOCATIONS.find((l) => l.slug === location);
  if (loc) return loc.name;
  return location.charAt(0).toUpperCase() + location.slice(1);
};

export const getAutoTitle = (formData: Record<string, any>, selectedCategory: string | null, user: any) => {
  const locationName = getLocationName(formData.location);
  
  if (selectedCategory === "accommodation") {
    return formData.accType && formData.location
      ? `Smeštaj za ${formData.totalBeds || "radnike"} (${ACCOMMODATION_TYPES.find((t) => t.slug === formData.accType)?.name || "Smeštaj"}) - ${locationName}`
      : "Novi Smeštaj";
  }
  
  if (selectedCategory === "catering") {
    return formData.catKitchenType && formData.location
      ? `Ketering za radnike (${KITCHEN_TYPES.find((t) => t.id === formData.catKitchenType || t.slug === formData.catKitchenType)?.name || formData.catKitchenType}) - ${locationName}`
      : "Novi Ketering";
  }
  
  if (selectedCategory === "machines") {
    const subCatName = MACHINE_SUBCATEGORIES[formData.machCategory]?.find(
      (s) => s.id === formData.machSubCategory,
    )?.name || "";
    return `${subCatName} - ${formData.machBrand} ${formData.machModel}`.trim().replace(/^-\s*/, "") || "Nova Mašina";
  }
  
  if (selectedCategory === "plot") {
    return formData.plotPurpose
      ? `${(REAL_ESTATE_PURPOSES.find((p) => p.id === formData.plotPurpose || p.slug === formData.plotPurpose)?.name || formData.plotPurpose).toUpperCase()} ZEMLJIŠTE - ${locationName}`
      : "Novi Plac";
  }
  
  if (selectedCategory === "marketplace") {
    return formData.title || "Novi alat ili oprema";
  }
  
  if (selectedCategory === "company") {
    return formData.companyName || user?.company || "Nova Firma";
  }

  if (selectedCategory === "job") {
    if (formData.profession && formData.location) {
      const profName = getProfessionName(formData, selectedCategory);
      return `${profName} — ${locationName}`;
    }
    if (formData.sector && formData.location) {
      const sectorName = SECTORS.find((s) => s.slug === formData.sector)?.name || "";
      return `${sectorName} — ${locationName}`;
    }
    return formData.location ? `Posao — ${locationName}` : "Posao";
  }

  if (formData.profession && formData.location) {
    const profName = getProfessionName(formData, selectedCategory);
    return `${profName} — ${locationName}`;
  }
  
  return "Novi Oglas";
};

