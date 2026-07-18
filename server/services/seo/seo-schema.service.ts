import { db } from "../../config/firebase.ts";
import { CacheService } from "../cache.service.ts";
import { logger } from "../../utils/logger.ts";
import { generateBreadcrumbSchema } from "@svet-gradjevine/shared";
import { GERMAN_SLUGS as deSlugs } from "../../constants/geo.ts";

function slugifyLocation(loc: string): string {
  return loc.toLowerCase()
    .replace(/đ/g, "dj").replace(/č/g, "c").replace(/ć/g, "c").replace(/š/g, "s")
    .replace(/ž/g, "z").replace(/ü/g, "ue").replace(/ö/g, "oe").replace(/ä/g, "ae")
    .replace(/ß/g, "ss").replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function resolveCountry(location?: string): string {
  if (!location) return "RS";
  return deSlugs.has(slugifyLocation(location)) ? "DE" : "RS";
}

// Mapira engagementSlug / employmentType na Google JobPosting employmentType vrednosti
function mapEmploymentType(engagementSlug?: unknown, employmentType?: unknown): string {
  if (typeof employmentType === "string" && employmentType.trim()) {
    return employmentType.trim().toUpperCase();
  }
  const slug = typeof engagementSlug === "string" ? engagementSlug.trim().toLowerCase() : "";
  switch (slug) {
    case "part-time":
    case "parttime":
    case "part_time":
      return "PART_TIME";
    case "contract":
    case "contractor":
    case "ugovor":
    case "freelance":
      return "CONTRACTOR";
    case "temporary":
    case "privremeno":
      return "TEMPORARY";
    case "intern":
    case "praksa":
    case "internship":
      return "INTERN";
    case "volunteer":
    case "volonter":
      return "VOLUNTEER";
    case "full-time":
    case "fulltime":
    case "full_time":
    case "stalno":
    case "naodredjeno":
    case "odredjeno":
      return "FULL_TIME";
    default:
      return "FULL_TIME";
  }
}

export interface SEOEntityData {
  [key: string]: unknown;
  id?: string;
  uid?: string;
  title?: string;
  name?: string;
  adTitle?: string;
  description?: string;
  kategorija?: string;
  zanimanje?: string;
  category?: string;
  subcategory?: string;
  namena?: string;
  location?: string;
  locationSlug?: string;
  city?: string;
  grad?: string;
  loc?: string;
  companyId?: string;
  comp?: string;
  companyName?: string;

  salary?: string | number;
  plataMin?: number;
  plataMax?: number;
  logo?: string;
  images?: string[];
  photoURL?: string;
  photo?: string;
  avatar?: string;
  website?: string;
  socialLinks?: { facebook?: string; instagram?: string; linkedin?: string };
  pib?: string;
  services?: string[];
  isVerified?: boolean;
  verified?: boolean;
  stats?: { averageRating?: number; totalReviews?: number; views?: number | string };
  averageRating?: number;
  reviewCount?: number;
  reviewsCount?: number;
  profileScore?: number;
  price?: string | number;
  currency?: string;
  tip?: string;
  type?: string;
  tacnaLokacija?: string;
  address?: string;
  telefon?: string;
  contactPhone?: string;
  phone?: string;
  profession?: string;
  about?: string;
  skills?: string[];
  role?: string;
  email?: string;
  contact?: string;
  industry?: string;
  status?: string;
  viewsCount?: number;
  createdAt?: { toDate?: () => Date; toMillis?: () => number } | number | string;
  updatedAt?: { toDate?: () => Date; toMillis?: () => number } | number | string;
}

interface GraphEntity {
  "@type"?: string;
  name?: string;
  title?: string;
  description?: string;
  url?: string;
  image?: string;
  address?: { addressLocality?: string };
  offers?: { price?: string | number; priceCurrency?: string };
  baseSalary?: { currency?: string; value?: { value?: number; minValue?: number } };
}

export class SEOSchemaService {
  /**
   * Transforms string for URL friendliness.
   */
  public static slugify(text: string): string {
    const cyrillicToLatin: { [key: string]: string } = {
      а: "a", б: "b", в: "v", г: "g", д: "d", ђ: "dj",
      е: "e", ж: "z", з: "z", и: "i", ј: "j", к: "k",
      л: "l", љ: "lj", м: "m", н: "n", њ: "nj", о: "o",
      п: "p", р: "r", с: "s", т: "t", ћ: "c", у: "u",
      ф: "f", х: "h", ц: "c", ч: "c", џ: "dz", ш: "s"
    };
    let str = text.toLowerCase();
    str = str
      .split("")
      .map((char) => cyrillicToLatin[char] || char)
      .join("");
    return str
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  public static generateBreadcrumbSchema(
    items: { name: string; item: string }[],
  ) {
    return generateBreadcrumbSchema(
      items.map((it) => ({ name: it.name, url: it.item })),
    );
  }

  public static async generateStructuredData(
    type: string,
    data: SEOEntityData,
    fullPath?: string,
  ) {
    const rawId = data?.id || data?.uid || "generic";
    const cachePath = fullPath ? Buffer.from(fullPath).toString("base64") : "none";
    const schemaCacheKey = `seo:structure_schema:${type}:${rawId}:${cachePath}`;

    try {
      const cachedSchema = await CacheService.get<any>(schemaCacheKey);
      if (cachedSchema) {
        return cachedSchema;
      }
    } catch (err) {
      logger.warn("[SEOSchemaService] Cache read error:", err);
    }

    const id = data?.id;
    const schemas: Record<string, unknown>[] = [];
    const breadcrumbItems = [
      { name: "PoÄetna", item: "https://svetgradjevine.com/" },
    ];

    // Derived Canonical URL for the entity
    const typeMapping: Record<string, string> = {
      jobs: "posao",
      companies: "firma",
      users: "profil",
    };
    const mappedType = typeMapping[type] || type;
    const canonicalEntityUrl = fullPath
      ? `https://svetgradjevine.com${fullPath}`
      : `https://svetgradjevine.com/${mappedType}/${id}`;

    if (type === "jobs") {
      breadcrumbItems.push({
        name: "Poslovi",
        item: "https://svetgradjevine.com/poslovi",
      });

      const profession = data.kategorija || data.zanimanje || data.category;
      if (profession) {
        breadcrumbItems.push({
          name: profession,
          item: `https://svetgradjevine.com/poslovi/${this.slugify(profession)}`,
        });
      }

      if (data.location) {
        const locationPath = profession
          ? `https://svetgradjevine.com/poslovi/${this.slugify(profession)}/${this.slugify(data.location)}`
          : `https://svetgradjevine.com/poslovi/${this.slugify(data.location)}`;
        breadcrumbItems.push({
          name: data.location,
          item: locationPath,
        });
      }
      breadcrumbItems.push({ name: data.title || "", item: canonicalEntityUrl });
      const companyId = data.companyId || data.comp;
      const schema: Record<string, unknown> = {
        "@context": "https://schema.org/",
        "@type": "JobPosting",
        "@id": `${canonicalEntityUrl}#posting`,
        title: data.title || "",
        description: data.description || "",
        datePosted:
          (data.createdAt as { toDate?: () => Date })?.toDate?.()?.toISOString() || new Date().toISOString(),
        validThrough: new Date(
          Date.now() + 60 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        employmentType: mapEmploymentType(data.engagementSlug, data.employmentType),
        hiringOrganization: {
          "@type": "Organization",
          "@id": companyId
            ? `https://svetgradjevine.com/firma/${companyId}#org`
            : undefined,
          name: data.companyName || "Svet GraÄ‘evine",
          logo: "https://svetgradjevine.com/logo192.png",
          url: companyId
            ? `https://svetgradjevine.com/firma/${companyId}`
            : "https://svetgradjevine.com",
        },
        jobLocation: {
          "@type": "Place",
          address: {
            "@type": "PostalAddress",
            addressLocality: data.location || data.city || "Srbija",
            addressCountry: resolveCountry(typeof data.location === "string" ? data.location : typeof data.city === "string" ? data.city : undefined),
          },
        },
      };

      const plataMin = Number(data.plataMin) || 0;
      const plataMax = Number(data.plataMax) || 0;
      const salary = Number(data.salary) || 0;
      if (plataMin > 0 || plataMax > 0 || salary > 0) {
        schema.baseSalary = {
          "@type": "MonetaryAmount",
          currency: "EUR",
          value: {
            "@type": "QuantitativeValue",
            value: salary || plataMin || plataMax,
            minValue: plataMin || salary,
            maxValue: plataMax || plataMin || salary,
            unitText: "MONTH",
          },
        };
      }
      schemas.push(schema);
    }

    if (type === "companies") {
      breadcrumbItems.push({
        name: "Firme",
        item: "https://svetgradjevine.com/firme",
      });
      if (data.city) {
        breadcrumbItems.push({
          name: data.city,
          item: `https://svetgradjevine.com/firme/${this.slugify(data.city)}`,
        });
      }
      breadcrumbItems.push({ name: data.name || "", item: canonicalEntityUrl });

      const schema: Record<string, unknown> = {
        "@context": "https://schema.org",
        "@type": "ConstructionBusiness",
        name: data.name || "",
        image: data.images?.[0] || data.logo,
        description: data.description,
        address: {
          "@type": "PostalAddress",
          addressLocality: data.city || "Srbija",
          addressCountry: "RS",
        },
        url: canonicalEntityUrl,
      };

      // Korak 9.5: E-E-A-T Reinforcement (sameAs & hasPart) - External Trust Signali
      const sameAs: string[] = [];
      if (data.website) sameAs.push(data.website);
      if (data.socialLinks?.facebook) sameAs.push(data.socialLinks.facebook);
      if (data.socialLinks?.instagram) sameAs.push(data.socialLinks.instagram);
      if (data.socialLinks?.linkedin) sameAs.push(data.socialLinks.linkedin);
      if (data.pib)
        sameAs.push(
          `https://pretraga.apr.gov.rs/enterprise/details/${data.pib}`,
        );
      if (sameAs.length > 0) schema.sameAs = sameAs;

      if (data.services && Array.isArray(data.services)) {
        schema.hasOfferCatalog = {
          "@type": "OfferCatalog",
          name: "Katalog Usluga",
          itemListElement: data.services.map((srv: string, idx: number) => ({
            "@type": "OfferCatalog",
            position: idx + 1,
            name: srv,
          })),
        };
      }

      if ((data.isVerified as boolean) && (data.stats as any)?.averageRating) {
        schema.aggregateRating = {
          "@type": "AggregateRating",
          ratingValue: Number((data.stats as any)?.averageRating).toFixed(1),
          reviewCount: Number((data.stats as any)?.totalReviews) || 1,
          bestRating: "5",
          worstRating: "1",
        };
      } else if ((data.isVerified as boolean) && (data.averageRating as number)) {
        schema.aggregateRating = {
          "@type": "AggregateRating",
          ratingValue: Number((data.averageRating as number)).toFixed(1),
          reviewCount: Number((data.reviewCount as number) || (data.reviewsCount as number)) || 1,
          bestRating: "5",
          worstRating: "1",
        };
      }

      schemas.push(schema);
    }

    if (type === "users") {
      breadcrumbItems.push({
        name: "Majstori",
        item: "https://svetgradjevine.com/majstori",
      });

      const profession = data.zanimanje || data.profession || data.kategorija;
      if (profession) {
        breadcrumbItems.push({
          name: profession,
          item: `https://svetgradjevine.com/majstori/${this.slugify(profession)}`,
        });
      }

      const city = data.location || data.city || data.grad;
      if (city) {
        const cityPath = profession
          ? `https://svetgradjevine.com/majstori/${this.slugify(profession)}/${this.slugify(city)}`
          : `https://svetgradjevine.com/majstori/${this.slugify(city)}`;
        breadcrumbItems.push({ name: city, item: cityPath });
      }

      breadcrumbItems.push({
        name: data.name || data.title || "",
        item: canonicalEntityUrl,
      });

      const schema: Record<string, unknown> = {
        "@context": "https://schema.org",
        "@type": "ProfessionalService",
        name: data.name || data.title || "",
        image: data.photo || data.avatar || data.images?.[0] || "",
        description:
          data.description?.substring(0, 300) ||
          data.about?.substring(0, 300) ||
          `GraÄ‘evinski majstor: ${data.name || ""}`,
        address: {
          "@type": "PostalAddress",
          addressLocality: data.location || data.city || "Srbija",
          addressCountry: "RS",
        },
        telephone: data.phone || data.telefon || "",
        url: canonicalEntityUrl,
      };

      // Korak 9.5: E-E-A-T Reinforcement za Majstore
      const sameAs: string[] = [];
      if (data.website) sameAs.push(data.website);
      if (data.socialLinks?.facebook) sameAs.push(data.socialLinks.facebook);
      if (data.socialLinks?.instagram) sameAs.push(data.socialLinks.instagram);
      if (data.socialLinks?.linkedin) sameAs.push(data.socialLinks.linkedin);
      if (sameAs.length > 0) schema.sameAs = sameAs;

      if (data.skills && Array.isArray(data.skills)) {
        schema.hasOfferCatalog = {
          "@type": "OfferCatalog",
          name: "VeÅ¡tine i Usluge",
          itemListElement: data.skills.map((skill: string, idx: number) => ({
            "@type": "OfferCatalog",
            position: idx + 1,
            name: skill,
          })),
        };
      }

      if (((data.isVerified as boolean) || (data.verified as boolean)) && (data.stats as any)?.averageRating) {
        schema.aggregateRating = {
          "@type": "AggregateRating",
          ratingValue: Number((data.stats as any)?.averageRating).toFixed(1),
          reviewCount: Number((data.stats as any)?.totalReviews) || 1,
          bestRating: "5",
          worstRating: "1",
        };
      } else if (((data.isVerified as boolean) || (data.verified as boolean)) && (data.averageRating as number)) {
        schema.aggregateRating = {
          "@type": "AggregateRating",
          ratingValue: Number((data.averageRating as number)).toFixed(1),
          reviewCount: Number((data.reviewCount as number) || (data.reviewsCount as number)) || 1,
          bestRating: "5",
          worstRating: "1",
        };
      } else if (
        ((data.isVerified as boolean) || (data.verified as boolean)) &&
        (data.profileScore as number) &&
        (data.profileScore as number) > 50
      ) {
        let score = (data.profileScore as number) / 20;
        if (score > 5) score = 5;
        schema.aggregateRating = {
          "@type": "AggregateRating",
          ratingValue: score.toFixed(1),
          reviewCount: Number((data.reviewCount as number) || 10),
          bestRating: "5",
          worstRating: "1",
        };
      }

      schemas.push(schema);
    }

    if (breadcrumbItems.length > 1) {
      schemas.push(this.generateBreadcrumbSchema(breadcrumbItems));
    }

    const resultSchemas = schemas.length > 0 ? schemas : null;
    if (resultSchemas) {
      try {
        await CacheService.set(schemaCacheKey, resultSchemas, 24 * 60 * 60 * 1000); // 24 hours
      } catch (err) {
        logger.warn("[SEOSchemaService] Cache write error:", err);
      }
    }

    return resultSchemas;
  }

  static async generateKnowledgeGraph() {
    const cacheKey = "seo:knowledge-graph:json";
    try {
      const cached = await CacheService.get<Record<string, unknown>[]>(cacheKey);
      if (cached) return cached;

      const graph: GraphEntity[] = [];
      const collections = [
        { name: "jobs", type: "JobPosting" },
        { name: "companies", type: "ConstructionBusiness" },
      ];

      for (const coll of collections) {
        try {
          const snap = await db
            .collection(coll.name)
            .where("status", "==", "active")
            .orderBy("createdAt", "desc")
            .limit(200)
            .get();
          for (const doc of snap.docs) {
            const data = doc.data();
            const structuredData = await this.generateStructuredData(coll.name, {
              ...data,
              id: doc.id,
            });
            if (structuredData) {
              if (Array.isArray(structuredData)) {
                // Omit Breadcrumb schemas if we just want raw entities in the graph
                const entities = structuredData.filter(
                  (s) => s["@type"] !== "BreadcrumbList",
                );
                graph.push(...entities);
              } else {
                if (structuredData["@type"] !== "BreadcrumbList") {
                  graph.push(structuredData);
                }
              }
            }
          }
        } catch (e) {
          console.error(`Error processing collection ${coll.name} for KG:`, e);
        }
      }

      const feed = {
        "@context": "https://schema.org",
        "@graph": graph,
      };

      await CacheService.set(cacheKey, feed, 3600000); // 1h cache
      return feed;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  static async generateKnowledgeGraphXML() {
    const feed = await this.generateKnowledgeGraph();
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<knowledgeGraph xmlns="https://schema.org/">\n`;
    const items = (feed as { "@graph"?: GraphEntity[] })["@graph"] || [];

    for (const item of items) {
      xml += `  <entity type="${item["@type"]}">\n`;
      if (item.name || item.title) {
        xml += `    <name><![CDATA[${item.name || item.title}]]></name>\n`;
      }
      if (item.description) {
        xml += `    <description><![CDATA[${item.description}]]></description>\n`;
      }
      if (item.url) {
        xml += `    <url>${item.url}</url>\n`;
      }
      if (item.image) {
        xml += `    <image>${item.image}</image>\n`;
      }
      if (item.address && item.address.addressLocality) {
        xml += `    <location><![CDATA[${item.address.addressLocality}]]></location>\n`;
      }
      if (item.offers && item.offers.price) {
        xml += `    <price currency="${item.offers.priceCurrency || "EUR"}">${item.offers.price}</price>\n`;
      }
      if (item.baseSalary) {
        try {
          xml += `    <salary currency="${item.baseSalary.currency}">${item.baseSalary.value?.value || item.baseSalary.value?.minValue}</salary>\n`;
        } catch (e) { console.error("[Schema] Salary XML error:", e); }
      }
      xml += `  </entity>\n`;
    }
    xml += `</knowledgeGraph>`;
    return xml;
  }
}

