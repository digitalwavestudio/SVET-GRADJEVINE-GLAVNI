import { Job } from '../types/jobs.ts';

function validateSchema(schema: any): any {
  if (!schema || typeof schema !== 'object') return null;
  // Minimal Google Rich Result check
  if (!schema['@context'] || !schema['@type']) return null;
  return schema;
}

export function generateJobSchema(job: Job, rating?: { ratingValue: number; reviewCount: number }) {
  if (!job) return null;
  return validateSchema({
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    "title": job.title || "Posao",
    "description": (job.description || job.opis || "Opis posla").substring(0, 320),
    "datePosted": job.createdAt ? (typeof job.createdAt === 'object' && (job.createdAt as any).toDate ? (job.createdAt as any).toDate().toISOString() : new Date(job.createdAt as any).toISOString()) : new Date().toISOString(),
    "validThrough": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    "employmentType": job.engagementSlug === 'full-time' ? 'FULL_TIME' : 'CONTRACTOR',
    "hiringOrganization": {
      "@type": "Organization",
      "name": job.comp || job.company || "Svet Građevine Korisnik",
      "sameAs": "https://svetgradjevine.com",
      "logo": {
        "@type": "ImageObject",
        "url": job.logo || "https://svetgradjevine.com/logo.png",
        "description": "Logo kompanije"
      }
    },
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": job.loc || job.location || "Srbija",
        "addressRegion": job.locationSlug || "",
        "addressCountry": "RS"
      }
    },
    "baseSalary": (job.plataMin && typeof job.plataMin === 'number') ? {
      "@type": "MonetaryAmount",
      "currency": "EUR",
      "value": {
        "@type": "QuantitativeValue",
        "minValue": job.plataMin,
        "maxValue": job.plataMax || job.plataMin,
        "unitText": "MONTH"
      }
    } : undefined,
    "aggregateRating": (rating && typeof rating.ratingValue === 'number') ? {
      "@type": "AggregateRating",
      "ratingValue": rating.ratingValue,
      "reviewCount": rating.reviewCount || 0
    } : undefined
  });
}

export function generateProductSchema(item: any, type: string, rating?: { ratingValue: number; reviewCount: number }) {
  if (!item || !item.id) return null;
  const price = typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0;
  return validateSchema({
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": item.title || item.name || "Proizvod",
    "image": (item.images && item.images.length > 0) ? item.images.map((imgUrl: string) => ({
      "@type": "ImageObject",
      "url": imgUrl,
      "description": item.title || item.name || "Slika proizvoda"
    })) : [{
      "@type": "ImageObject",
      "url": "https://svetgradjevine.com/logo.png",
      "description": "Logo Svet Građevine"
    }],
    "description": (item.description || item.opis || "Opis nije dostupan").substring(0, 160),
    "brand": {
      "@type": "Brand",
      "name": item.brand || "Ostalo"
    },
    "offers": {
      "@type": "Offer",
      "priceCurrency": "EUR",
      "price": price,
      "availability": "https://schema.org/InStock",
      "url": `https://svetgradjevine.com/${type}/${item.id}`
    },
    "aggregateRating": (rating && typeof rating.ratingValue === 'number') ? {
      "@type": "AggregateRating",
      "ratingValue": rating.ratingValue,
      "reviewCount": rating.reviewCount || 0
    } : undefined
  });
}

export function generateLocalBusinessSchema(profile: any, rating?: { ratingValue: number; reviewCount: number }) {
  if (!profile || !profile.uid) return null;
  return validateSchema({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": profile.name || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || "Korisnik",
    "image": {
      "@type": "ImageObject",
      "url": profile.photoURL || "https://svetgradjevine.com/logo.png",
      "description": `Profilna slika korisnika ${profile.name || ''}`.trim()
    },
    "@id": `https://svetgradjevine.com/profil/${profile.uid}`,
    "url": `https://svetgradjevine.com/profil/${profile.uid}`,
    "telephone": profile.phone || "",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": profile.city || "Srbija",
      "addressCountry": "RS"
    },
    "aggregateRating": (rating && typeof rating.ratingValue === 'number') ? {
      "@type": "AggregateRating",
      "ratingValue": rating.ratingValue,
      "reviewCount": rating.reviewCount || 0
    } : undefined
  });
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
}

export function generateFAQSchema(questions: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": questions.map(q => ({
      "@type": "Question",
      "name": q.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": q.answer
      }
    }))
  };
}

export function generateWebsiteSearchSchema(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "url": baseUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${baseUrl}/pretrazivanje?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };
}
