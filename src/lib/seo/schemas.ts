import { APP_CONFIG } from "@/src/constants/config";

/**
 * Enterprise SEO Schema Layer
 * All structured data (JSON-LD) is centralized here to keep components lean.
 */

// --- Base Schemas ---

export const ORGANIZATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Svet Građevine",
  "url": APP_CONFIG.BASE_URL,
  "logo": `${APP_CONFIG.BASE_URL}/logo.png`,
  "description": "Vodeća platforma za građevinsku industriju u Srbiji i regionu",
  "sameAs": [
    "https://facebook.com/svetgradjevine",
    "https://linkedin.com/company/svet-gradjevine",
    "https://instagram.com/svetgradjevine"
  ]
};

export const WEBSITE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "url": `${APP_CONFIG.BASE_URL}/`,
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": `${APP_CONFIG.BASE_URL}/pretraga?q={search_term_string}`
    },
    "query-input": "required name=search_term_string"
  }
};

// --- Factory Functions for Dynamic Schemas ---

export interface FAQItem {
  question: string;
  answer: string;
}

export function createFAQSchema(items: FAQItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": items.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  };
}

export interface BreadcrumbItem {
  name: string;
  item: string;
}

export function createBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.item.startsWith('http') ? item.item : `${APP_CONFIG.BASE_URL}${item.item}`
    }))
  };
}

export interface JobPostingData {
  title: string;
  description: string;
  datePosted: string;
  validThrough?: string;
  employmentType: string[];
  hiringOrganization: {
    name: string;
    sameAs?: string;
    logo?: string;
  };
  jobLocation: {
    addressLocality: string;
    addressCountry: string;
  };
  baseSalary?: {
    currency: string;
    value: number;
    unitText: string;
  };
}

export function createJobPostingSchema(data: JobPostingData) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    "title": data.title,
    "description": data.description,
    "datePosted": data.datePosted,
    "employmentType": data.employmentType,
    "hiringOrganization": {
      "@type": "Organization",
      "name": data.hiringOrganization.name,
      "sameAs": data.hiringOrganization.sameAs,
      "logo": data.hiringOrganization.logo
    },
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": data.jobLocation.addressLocality,
        "addressCountry": data.jobLocation.addressCountry
      }
    }
  };

  if (data.validThrough) schema.validThrough = data.validThrough;
  if (data.baseSalary) {
    schema.baseSalary = {
      "@type": "MonetaryAmount",
      "currency": data.baseSalary.currency,
      "value": {
        "@type": "QuantitativeValue",
        "value": data.baseSalary.value,
        "unitText": data.baseSalary.unitText
      }
    };
  }

  return schema;
}

export interface ProductData {
  name: string;
  image?: string[];
  description: string;
  brand?: string;
  offers: {
    price: number;
    priceCurrency: string;
    availability?: string;
    url?: string;
  };
}

export function createProductSchema(data: ProductData) {
  return {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": data.name,
    "image": data.image,
    "description": data.description,
    "brand": data.brand ? {
      "@type": "Brand",
      "name": data.brand
    } : undefined,
    "offers": {
      "@type": "Offer",
      "url": data.offers.url,
      "priceCurrency": data.offers.priceCurrency,
      "price": data.offers.price,
      "availability": data.offers.availability || "https://schema.org/InStock"
    }
  };
}

export interface BlogItem {
  headline: string;
  description: string;
  image?: string;
  datePublished: string;
  authorName: string;
}

export function createBlogSchema(name: string, description: string, posts: BlogItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": name,
    "description": description,
    "publisher": {
      "@type": "Organization",
      "name": "Svet Građevine",
      "logo": `${APP_CONFIG.BASE_URL}/logo192.png`
    },
    "blogPost": posts.map((post, index) => ({
      "@type": "BlogPosting",
      "headline": post.headline,
      "description": post.description,
      "image": post.image,
      "datePublished": post.datePublished,
      "author": {
        "@type": "Organization",
        "name": post.authorName
      },
      "position": index + 1
    }))
  };
}

export interface PersonData {
  name: string;
  description: string;
  image?: string;
  jobTitle?: string;
  url: string;
  skills?: string[];
  location?: string;
  phone?: string;
  socialLinks?: string[];
  role?: string;
}

export function createPersonSchema(data: PersonData) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": data.role === 'poslodavac' ? "HomeAndConstructionBusiness" : "Person",
    "name": data.name,
    "description": data.description,
    "image": data.image || `${APP_CONFIG.BASE_URL}/logo192.png`,
    "url": data.url,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": data.url
    }
  };

  if (data.jobTitle) schema.jobTitle = data.jobTitle;
  if (data.skills && data.skills.length > 0) {
    schema.hasOccupation = {
      "@type": "Occupation",
      "name": data.jobTitle || "Građevinski stručnjak",
      "skills": data.skills
    };
    schema.knowsAbout = data.skills;
  }

  if (data.location) {
    schema.address = {
      "@type": "PostalAddress",
      "addressLocality": data.location,
      "addressRegion": "Srbija",
      "addressCountry": "RS"
    };
  }

  if (data.phone) schema.telephone = data.phone;
  if (data.socialLinks && data.socialLinks.length > 0) {
    schema.sameAs = data.socialLinks;
  }

  return schema;
}
