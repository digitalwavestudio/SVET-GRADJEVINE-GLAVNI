import { sanitizeInput } from '@/src/lib/sanitize';

const BASE_URL = 'https://www.svetgradjevine.com';

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  beograd: { lat: 44.7866, lng: 20.4489 },
  "novi-sad": { lat: 45.2671, lng: 19.8335 },
  nis: { lat: 43.3209, lng: 21.8958 },
  kragujevac: { lat: 44.0128, lng: 20.9114 },
  cacak: { lat: 43.8914, lng: 20.3503 },
  kraljevo: { lat: 43.7234, lng: 20.687 },
  subotica: { lat: 46.1005, lng: 19.6646 },
  zrenjanin: { lat: 45.3836, lng: 20.3819 },
  pancevo: { lat: 44.8708, lng: 20.6403 },
  valjevo: { lat: 44.2666, lng: 19.8833 },
  kopaonik: { lat: 43.2847, lng: 20.8094 },
  zlatibor: { lat: 43.7297, lng: 19.6993 },
};

export interface LocalBusinessSchema {
  id?: string;
  name: string;
  logo?: string;
  coverImage?: string;
  description?: string;
  city?: string;
  address?: string;
  phone?: string;
  website?: string;
  locationSlug?: string;
  facebook?: string;
  instagram?: string;
}


/**
 * Interfaces for SEO entities
 */
interface FirestoreTimestamp {
  toDate: () => Date;
}

export interface JobPostingSchema {
  id?: string;
  title: string;
  description: string;
  companyName?: string;
  location?: string;
  createdAt: string | number | Date | FirestoreTimestamp;
  employmentType?: string;
  companyId?: string;
  locationSlug?: string;
  sector?: string;
  professionSlug?: string;
  plataMin?: number | string;
  plataMax?: number | string;
  salary?: number | string;
}

export interface ProfessionalServiceInput {
  name?: string;
  title?: string;
  description?: string;
  about?: string;
  photo?: string;
  avatar?: string;
  images?: string[];
  location?: string;
  phone?: string;
  hourlyRate?: string | number;
}

export interface ProductInput {
  name?: string;
  title?: string;
  image?: string;
  images?: string[];
  description?: string;
  price?: number | string;
  status?: string;
  url?: string;
}

export interface MachineInput {
  title?: string;
  adTitle?: string;
  description?: string;
  opis?: string;
  images?: string[];
  manufacturer?: string;
  model?: string;
  price?: number | string;
  pricePerDay?: number | string;
  status?: string;
  companyName?: string;
  authorName?: string;
  companyId?: string;
}

export interface RealEstateInput {
  title?: string;
  description?: string;
  images?: string[];
  area?: number | string;
  areaUnit?: string;
  price?: number | string;
}

export interface LodgingInput {
  title?: string;
  description?: string;
  images?: string[];
  tacnaLokacija?: string;
  telefon?: string;
  contactPhone?: string;
  phone?: string;
  price?: number | string;
  totalRooms?: number | string;
}

export interface FoodEstablishmentInput {
  title?: string;
  description?: string;
  images?: string[];
  phone?: string;
}

export interface MenuItemInput {
  name?: string;
  description?: string;
  image?: string;
  price?: number | string;
  nutrition?: string;
}

export const generateJobSchema = (jobData: JobPostingSchema) => {
  const companyUrl = jobData.companyId ? `${BASE_URL}/firma/${jobData.companyId}` : BASE_URL;
  const organizationId = `${companyUrl}#organization`;
  const locationSlug = jobData.locationSlug || jobData.location?.toLowerCase().replace(/ /g, '-') || "srbija";
  const branchId = `${companyUrl}#branch-${locationSlug}`;
  const placeId = `${BASE_URL}/poslovi/${locationSlug}#place`;
  const jobUrl = `${BASE_URL}/posao/${jobData.id}`;
  const productId = `${jobUrl}#perk-equipment`;

  const coords = CITY_COORDS[locationSlug] || CITY_COORDS['beograd'];

  const jobSchema: Record<string, unknown> = {
    "@type": "JobPosting",
    "@id": `${jobUrl}#job`,
    "title": sanitizeInput(jobData.title),
    "description": sanitizeInput(jobData.description),
    "identifier": {
      "@type": "PropertyValue",
      "name": "Svet Građevine",
      "value": sanitizeInput(jobData.id)
    },
    // Link to our LocalBusiness branch which is part of the Organization
    "hiringOrganization": { "@id": branchId },
    "jobLocation": {
      "@type": "Place",
      "@id": placeId,
      "name": sanitizeInput(jobData.location || "Srbija"),
      "address": {
        "@type": "PostalAddress",
        "addressLocality": sanitizeInput(jobData.location || "Srbija"),
        "addressCountry": "RS"
      }
    },
    "datePosted": (jobData.createdAt && typeof jobData.createdAt === 'object' && 'toDate' in jobData.createdAt && typeof jobData.createdAt.toDate === 'function')
      ? jobData.createdAt.toDate().toISOString()
      : typeof jobData.createdAt === 'string'
        ? jobData.createdAt
        : jobData.createdAt instanceof Date
          ? jobData.createdAt.toISOString()
          : new Date().toISOString(),
    "employmentType": "FULL_TIME",
    "industry": "Construction",
    "occupationalCategory": sanitizeInput(jobData.professionSlug || jobData.sector || "Construction Worker")
  };

  if (jobData.plataMin || jobData.plataMax || jobData.salary) {
     jobSchema.baseSalary = {
      "@type": "MonetaryAmount",
      "currency": "EUR",
      "value": {
        "@type": "QuantitativeValue",
        "value": sanitizeInput(jobData.salary || jobData.plataMin || 0),
        "minValue": sanitizeInput(jobData.plataMin || 0),
        "maxValue": sanitizeInput(jobData.plataMax || jobData.plataMin || 0),
        "unitText": "MONTH"
      }
    };
  }

  const resultGraph = [
    {
      "@type": "Organization",
      "@id": organizationId,
      "name": sanitizeInput(jobData.companyName || "Svet Građevine"),
      "url": companyUrl,
      "sameAs": companyUrl
    },
    {
      "@type": "LocalBusiness",
      "@id": branchId,
      "name": `${sanitizeInput(jobData.companyName || "Firma")} - ${sanitizeInput(jobData.location || "Srbija")}`,
      "parentOrganization": { "@id": organizationId },
      "url": companyUrl,
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": coords.lat,
        "longitude": coords.lng
      },
      "address": {
        "@type": "PostalAddress",
        "addressLocality": sanitizeInput(jobData.location || "Srbija"),
        "addressCountry": "RS"
      },
      "makesOffer": {
        "@type": "Offer",
        "itemOffered": { "@id": productId }
      }
    },
    {
      "@type": "Product",
      "@id": productId,
      "name": "Obezbeđen alat i oprema za rad",
      "description": "Profesionalan alat i HTZ oprema obezbeđeni od strane poslodavca za radnike na projektu."
    },
    jobSchema
  ];

  return {
    "@context": "https://schema.org",
    "@graph": resultGraph
  };
};

export const generateLocalBusinessSchema = (companyData: LocalBusinessSchema) => {
  const companyUrl = companyData.website || companyData.id ? `${BASE_URL}/firma/${companyData.id}` : BASE_URL;
  const organizationId = `${companyUrl}#organization`;
  const locationSlug = companyData.locationSlug || companyData.city?.toLowerCase().replace(/ /g, '-') || "srbija";
  const placeId = `${BASE_URL}/firme/${locationSlug}#place`;

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": organizationId,
    "name": sanitizeInput(companyData.name),
    "image": sanitizeInput(companyData.logo || companyData.coverImage || ""),
    "description": sanitizeInput(companyData.description?.replace(/<\/?[^>]+(>|$)/g, "").substring(0, 300) || ""),
    "location": {
      "@type": "Place",
      "@id": placeId,
      "name": sanitizeInput(companyData.city || "Srbija"),
      "address": {
        "@type": "PostalAddress",
        "streetAddress": sanitizeInput(companyData.address || ""),
        "addressLocality": sanitizeInput(companyData.city || companyData.locationSlug || ""),
        "addressRegion": "Srbija",
        "addressCountry": "RS"
      }
    },
    // Keep backward compatibility with address field directly on business
    "address": {
      "@type": "PostalAddress",
      "streetAddress": sanitizeInput(companyData.address || ""),
      "addressLocality": sanitizeInput(companyData.city || companyData.locationSlug || ""),
      "addressRegion": "Srbija",
      "addressCountry": "RS"
    },
    "telephone": sanitizeInput(companyData.phone || ""),
    "url": sanitizeInput(companyUrl),
    "sameAs": [
      companyData.website,
      companyData.facebook,
      companyData.instagram
    ].filter((link): link is string => typeof link === 'string' && link.length > 0).map(sanitizeInput)
  };
};

export const generateProfessionalServiceSchema = (masterData: ProfessionalServiceInput, url: string) => {
  const locationSlug = masterData.location?.toLowerCase().replace(/ /g, '-') || "srbija";
  const placeId = `${BASE_URL}/majstori/${locationSlug}#place`;
  const personId = `${url}#person`;

  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": personId,
    "name": sanitizeInput(masterData.name || masterData.title || ""),
    "image": sanitizeInput(masterData.photo || masterData.avatar || (masterData.images && masterData.images.length > 0 ? masterData.images[0] : "")),
    "description": sanitizeInput(masterData.description?.replace(/<\/?[^>]+(>|$)/g, "").substring(0, 300) || masterData.about?.replace(/<\/?[^>]+(>|$)/g, "").substring(0, 300) || `Građevinski majstor: ${masterData.name || masterData.title || ""}`),
    "location": {
      "@type": "Place",
      "@id": placeId,
      "name": sanitizeInput(masterData.location || "Srbija"),
      "address": {
        "@type": "PostalAddress",
        "addressLocality": sanitizeInput(masterData.location || "Srbija"),
        "addressCountry": "RS"
      }
    },
    // Backwards compatibility
    "address": {
      "@type": "PostalAddress",
      "addressLocality": sanitizeInput(masterData.location || "Srbija"),
      "addressCountry": "RS"
    },
    "telephone": sanitizeInput(masterData.phone || ""),
    "url": sanitizeInput(url),
    "priceRange": masterData.hourlyRate ? `€${masterData.hourlyRate}/h` : undefined
  };
};

export const generateProductSchema = (productData: ProductInput, category: string = 'proizvod') => {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": sanitizeInput(productData.name || productData.title || ""),
    "image": productData.image ? sanitizeInput(productData.image) : (productData.images && productData.images.length > 0 ? sanitizeInput(productData.images[0]) : undefined),
    "description": sanitizeInput(productData.description?.replace(/<\/?[^>]+(>|$)/g, "").substring(0, 300) || ""),
    "category": sanitizeInput(category),
    "offers": {
      "@type": "Offer",
      "price": productData.price,
      "priceCurrency": "EUR",
      "availability": productData.status === 'active' ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "url": productData.url ? sanitizeInput(productData.url) : undefined
    }
  };
};

export const generateMachineSchema = (machineData: MachineInput, locationName: string, categoryName: string, url: string) => {
  const companyUrl = machineData.companyId ? `${BASE_URL}/firma/${machineData.companyId}` : BASE_URL;
  const organizationId = `${companyUrl}#organization`;
  const locationSlug = locationName?.toLowerCase().replace(/ /g, '-') || "srbija";
  const placeId = `${BASE_URL}/gradjevinske-masine/${locationSlug}#place`;
  const productId = `${url}#product`;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": productId,
    "name": sanitizeInput(machineData.title || machineData.adTitle || ""),
    "description": sanitizeInput(machineData.description?.replace(/<\/?[^>]+(>|$)/g, "").substring(0, 300) || machineData.opis?.replace(/<\/?[^>]+(>|$)/g, "").substring(0, 300) || `Građevinska mašina: ${machineData.title || machineData.adTitle}. Kategorija: ${categoryName}. Lokacija: ${locationName}.`),
    "image": machineData.images || [],
    "brand": {
      "@type": "Brand",
      "name": sanitizeInput(machineData.manufacturer || "Nepoznat proizvođač")
    },
    "model": sanitizeInput(machineData.model || ""),
    "offers": {
      "@type": "Offer",
      "price": machineData.price || machineData.pricePerDay || 0,
      "priceCurrency": "EUR",
      "availability": machineData.status === 'active' ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "url": sanitizeInput(url),
      "seller": {
        "@type": "Organization",
        "@id": organizationId,
        "name": sanitizeInput(machineData.companyName || machineData.authorName || "Svet Građevine")
      },
      "availableAtOrFrom": {
        "@type": "Place",
        "@id": placeId,
        "name": sanitizeInput(locationName || "Srbija"),
        "address": {
          "@type": "PostalAddress",
          "addressLocality": sanitizeInput(locationName || "Srbija"),
          "addressCountry": "RS"
        }
      }
    }
  };
};

export const generateRealEstateSchema = (plotData: RealEstateInput, locationName: string, purposeName: string, url: string) => {
  const locationSlug = locationName?.toLowerCase().replace(/ /g, '-') || "srbija";
  const placeId = `${BASE_URL}/placevi/${locationSlug}#place`;
  const realEstateId = `${url}#realestate`;

  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "@id": realEstateId,
    "name": sanitizeInput(plotData.title || ""),
    "description": sanitizeInput(plotData.description?.replace(/<\/?[^>]+(>|$)/g, "").substring(0, 300) || `${purposeName} plac u mestu ${locationName}. Površina: ${plotData.area} ${plotData.areaUnit}.`),
    "image": plotData.images || [],
    "url": sanitizeInput(url),
    "address": {
      "@type": "PostalAddress",
      "addressLocality": sanitizeInput(locationName),
      "addressRegion": "Srbija",
      "addressCountry": "RS"
    },
    "about": {
       "@type": "Place",
       "@id": placeId,
       "name": sanitizeInput(locationName || "Srbija"),
       "address": {
         "@type": "PostalAddress",
         "addressLocality": sanitizeInput(locationName),
         "addressRegion": "Srbija",
         "addressCountry": "RS"
       }
    },
    "offers": {
      "@type": "Offer",
      "price": plotData.price || 0,
      "priceCurrency": "EUR",
      "url": sanitizeInput(url)
    }
  };
};

export const generateLodgingSchema = (accommodationData: LodgingInput, locationName: string, url: string, additionalFeatures?: Record<string, unknown>) => {
  const locationSlug = locationName?.toLowerCase().replace(/ /g, '-') || "srbija";
  const placeId = `${BASE_URL}/smestaj/${locationSlug}#place`;
  const lodgingId = `${url}#lodgingbusiness`;

  return {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    "@id": lodgingId,
    "name": sanitizeInput(accommodationData.title || ""),
    "description": sanitizeInput(accommodationData.description?.replace(/<\/?[^>]+(>|$)/g, "").substring(0, 300) || `Smeštaj za radnike: ${accommodationData.title} u mestu ${locationName}.`),
    "image": accommodationData.images || [],
    "location": {
      "@type": "Place",
      "@id": placeId,
      "name": sanitizeInput(locationName || "Srbija"),
      "address": {
        "@type": "PostalAddress",
        "addressLocality": sanitizeInput(locationName),
        "addressRegion": "Srbija",
        "addressCountry": "RS",
        "streetAddress": sanitizeInput(accommodationData.tacnaLokacija || "")
      }
    },
    // Backwards compatibility
    "address": {
      "@type": "PostalAddress",
      "addressLocality": sanitizeInput(locationName),
      "addressRegion": "Srbija",
      "addressCountry": "RS",
      "streetAddress": sanitizeInput(accommodationData.tacnaLokacija || "")
    },
    "telephone": sanitizeInput(accommodationData.telefon || accommodationData.contactPhone || accommodationData.phone || ""),
    "url": sanitizeInput(url),
    "priceRange": `€${accommodationData.price || 0}`,
    "publicAccess": true,
    ...(accommodationData.totalRooms && { "numberOfRooms": accommodationData.totalRooms }),
    ...additionalFeatures
  };
};

export const generateFoodEstablishmentSchema = (cateringData: FoodEstablishmentInput, locationName: string, url: string) => {
  const locationSlug = locationName?.toLowerCase().replace(/ /g, '-') || "srbija";
  const placeId = `${BASE_URL}/ketering/${locationSlug}#place`;
  const cateringId = `${url}#foodestablishment`;

  return {
    "@context": "https://schema.org",
    "@type": "FoodEstablishment",
    "@id": cateringId,
    "name": sanitizeInput(cateringData.title || ""),
    "description": sanitizeInput(cateringData.description?.replace(/<\/?[^>]+(>|$)/g, "").substring(0, 300) || `Ketering usluge za radnike: ${cateringData.title} u mestu ${locationName}.`),
    "image": cateringData.images || [],
    "location": {
      "@type": "Place",
      "@id": placeId,
      "name": sanitizeInput(locationName || "Srbija"),
      "address": {
        "@type": "PostalAddress",
        "addressLocality": sanitizeInput(locationName),
        "addressRegion": "Srbija",
        "addressCountry": "RS"
      }
    },
    // Backwards compatibility
    "address": {
      "@type": "PostalAddress",
      "addressLocality": sanitizeInput(locationName),
      "addressRegion": "Srbija",
      "addressCountry": "RS"
    },
    "telephone": sanitizeInput(cateringData.phone || ""),
    "url": sanitizeInput(url),
    "servesCuisine": "Domaća kuhinja",
    "acceptsReservations": "True"
  };
};

export const generateMenuItemSchema = (itemData: MenuItemInput, providerId: string, url: string) => {
  return {
    "@context": "https://schema.org",
    "@type": "MenuItem",
    "name": sanitizeInput(itemData.name || ""),
    "description": sanitizeInput(itemData.description?.replace(/<\/?[^>]+(>|$)/g, "").substring(0, 300) || ""),
    "image": itemData.image ? sanitizeInput(itemData.image) : undefined,
    "url": sanitizeInput(url),
    "offers": {
      "@type": "Offer",
      "price": itemData.price,
      "priceCurrency": "RSD",
      "availability": "https://schema.org/InStock",
      "url": sanitizeInput(url)
    },
    "nutrition": itemData.nutrition ? {
      "@type": "NutritionInformation",
      "calories": sanitizeInput(itemData.nutrition)
    } : undefined
  };
};

export const generateCollectionSchema = (
  type: string,
  itemsData: { name: string; url: string; description?: string; image?: string }[],
  metadata?: { name?: string; description?: string; url?: string },
  parent?: { name: string; url: string }
) => {
  const collectionUrl = sanitizeInput(metadata?.url || BASE_URL);
  const collectionName = sanitizeInput(metadata?.name || 'Kolekcija');
  
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${BASE_URL}/#website`,
        "url": BASE_URL,
        "name": "Svet Građevine",
        "description": "Najveći građevinski oglasnik i platforma u regionu"
      },
      {
        "@type": "CollectionPage",
        "@id": `${collectionUrl}#webpage`,
        "url": collectionUrl,
        "name": collectionName,
        "description": sanitizeInput(metadata?.description || ""),
        "isPartOf": { "@id": `${BASE_URL}/#website` },
        ...(parent && {
          "breadcrumb": {
            "@id": `${collectionUrl}#breadcrumb`
          }
        }),
        "mainEntity": {
          "@id": `${collectionUrl}#itemList`
        }
      },
      ...(parent ? [{
        "@type": "BreadcrumbList",
        "@id": `${collectionUrl}#breadcrumb`,
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": sanitizeInput(parent.name),
            "item": sanitizeInput(parent.url)
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": collectionName,
            "item": collectionUrl
          }
        ]
      }] : []),
      {
        "@type": "ItemList",
        "@id": `${collectionUrl}#itemList`,
        "name": collectionName,
        "itemListElement": itemsData.map((item, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "item": {
            "@type": type,
            "@id": `${sanitizeInput(item.url)}#item`,
            "name": sanitizeInput(item.name),
            "description": item.description ? sanitizeInput(item.description.replace(/<\/?[^>]+(>|$)/g, "").substring(0, 200)) : undefined,
            "url": sanitizeInput(item.url),
            "image": item.image ? sanitizeInput(item.image) : undefined
          }
        }))
      }
    ]
  };
};

export const generateCompanyListSchema = (itemsData: { name: string; url: string; description?: string; image?: string }[], metadata?: { name?: string; description?: string; url?: string }) => {
  return generateCollectionSchema('LocalBusiness', itemsData, metadata);
};

export const generateJobPostingListSchema = (itemsData: { name: string; url: string; description?: string; image?: string }[], metadata?: { name?: string; description?: string; url?: string }) => {
  return generateCollectionSchema('JobPosting', itemsData, metadata);
};

export const generateProfessionalServiceListSchema = (itemsData: { name: string; url: string; description?: string; image?: string }[], metadata?: { name?: string; description?: string; url?: string }) => {
  return generateCollectionSchema('ProfessionalService', itemsData, metadata);
};

export const generateProductListSchema = (itemsData: { name: string; url: string; description?: string; image?: string }[], metadata?: { name?: string; description?: string; url?: string }) => {
  return generateCollectionSchema('Product', itemsData, metadata);
};

export const generateLodgingListSchema = (itemsData: { name: string; url: string; description?: string; image?: string }[], metadata?: { name?: string; description?: string; url?: string }) => {
  return generateCollectionSchema('LodgingBusiness', itemsData, metadata);
};

export const generateFoodEstablishmentListSchema = (itemsData: { name: string; url: string; description?: string; image?: string }[], metadata?: { name?: string; description?: string; url?: string }) => {
  return generateCollectionSchema('FoodEstablishment', itemsData, metadata);
};

export const generateRealEstateListSchema = (itemsData: { name: string; url: string; description?: string; image?: string }[], metadata?: { name?: string; description?: string; url?: string }) => {
  return generateCollectionSchema('RealEstateListing', itemsData, metadata);
};

export const generateItemListSchema = (
  itemsData: { name: string; url: string; description?: string; image?: string }[],
  metadata?: { name?: string; description?: string; url?: string }
) => {
  return generateCollectionSchema('Thing', itemsData, metadata);
};

export const generateBreadcrumbSchema = (items: { name: string; url: string }[]) => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": sanitizeInput(item.name),
      "item": sanitizeInput(item.url)
    }))
  };
};
