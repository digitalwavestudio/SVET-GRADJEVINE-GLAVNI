import { PROFESSIONS, LOCATIONS, ACCOMMODATION_TYPES, KITCHEN_TYPES, REAL_ESTATE_PURPOSES } from "@/src/constants/taxonomy";
import { MACHINE_SUBCATEGORIES } from "@/src/constants/machineTaxonomy";
import { 
  jobSchema, machineSchema, accommodationSchema, cateringSchema, 
  realEstateSchema, marketplaceSchema, businessProfileSchema as companySchema 
} from '@svet-gradjevine/shared';

export const getValidationSchema = (category: string | null) => {
  switch (category) {
    case 'job': return jobSchema;
    case 'machines': return machineSchema;
    case 'accommodation': return accommodationSchema;
    case 'catering': return cateringSchema;
    case 'plot': return realEstateSchema;
    case 'marketplace': return marketplaceSchema;
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
  return prof ? prof.name.split(" (")[0] : "";
};

export const getLocationName = (location: string) => {
  const loc = LOCATIONS.find((l) => l.slug === location);
  return loc ? loc.name : "";
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
  
  if (formData.profession && formData.location) {
    const profName = getProfessionName(formData, selectedCategory);
    return `${profName} — ${locationName}`;
  }
  
  return "Novi Oglas";
};

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  standard: ["accommodation", "marketplace", "plot"],
  majstor: ["accommodation", "marketplace"],
  poslodavac: ["job", "company", "accommodation", "catering", "machines", "plot", "marketplace"],
  smestaj: ["accommodation"],
  ketering: ["catering"],
  placevi: ["plot"],
  masine: ["machines"],
  marketplace: ["marketplace"],
  partner: [],
  admin: ["job", "company", "accommodation", "catering", "machines", "plot", "marketplace"],
};
