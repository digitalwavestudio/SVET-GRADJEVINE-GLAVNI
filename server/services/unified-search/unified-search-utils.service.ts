import { ImageTransformer } from "../../utils/image.transformer.ts";
import { UnifiedSearchFilters, UnifiedSearchDoc } from "../unified-search.service.ts";

export class UnifiedSearchUtils {
  static analyzeQueryComplexity(filters: UnifiedSearchFilters): "SIMPLE" | "COMPLEX" {
    if (!filters) return "SIMPLE";

    // 1. Keyword search is ALWAYS complex (Full-text search)
    if (filters.search && filters.search.trim() !== "") {
      return "COMPLEX";
    }

    // 2. Radius and Geo search are ALWAYS complex
    if (filters.radius || (filters.lat && filters.lng)) {
      return "COMPLEX";
    }

    // 3. Evaluate inequality filters (Firestore restricts multiple inequalities on different fields)
    let inequalityCount = 0;
    if (filters.minWeightKg || filters.maxWeightKg) inequalityCount++;
    if (filters.minArea || filters.maxArea) inequalityCount++;
    if (filters.beds || filters.minBeds) inequalityCount++;
    if (filters.minPrice || filters.maxPrice) inequalityCount++;
    if (filters.minOrder) inequalityCount++;
    if (filters.dailyCapacity || filters.dailyCapacityMeals) inequalityCount++;

    if (inequalityCount > 1) {
      return "COMPLEX"; // Više od jedne range/inequality operacije -> COMPLEX
    }

    // 4. Array-contains restrictions
    let arrayContainsCount = 0;
    if (filters.mainCategory) arrayContainsCount++;
    if (
      filters.skills &&
      Array.isArray(filters.skills) &&
      filters.skills.length > 0
    )
      arrayContainsCount++;
    if (
      filters.mainCategories &&
      Array.isArray(filters.mainCategories) &&
      filters.mainCategories.length > 0
    )
      arrayContainsCount++;

    if (arrayContainsCount > 0 && inequalityCount > 0) {
      return "COMPLEX"; // Kombinacija array-contains i inequality može biti skupa u Firestore
    }

    return "SIMPLE";
  }

  static mapToArticle(doc: Record<string, unknown> | { data: () => Record<string, unknown>; id: string }): UnifiedSearchDoc {
    if (!doc) return { id: "", type: "article", status: "" };
    const isSnapshot = "data" in doc && typeof doc.data === "function";
    const data = isSnapshot ? (doc.data as () => Record<string, unknown>)() : (doc as Record<string, unknown>);
    const docId = isSnapshot ? (doc as { id: string }).id : (((doc as Record<string, unknown>).id as string) || ((doc as Record<string, unknown>).objectID as string) || "");

    return {
      id: docId,
      title: (data.title as string) || "",
      slug: (data.slug as string) || "",
      excerpt: (data.excerpt as string) || "",
      featuredImage: (data.featuredImage as string) || "",
      authorName: (data.authorName as string) || "Redakcija",
      category: (data.category as string) || "",
      publishedAt: (data.publishedAt as string | number) || "",
      viewCount: (data.viewCount as number) || 0,
      status: (data.status as string) || "",
      type: "article" // discriminator for unified UI
    };
  }

  static mapToListing(doc: Record<string, unknown> | { data: () => Record<string, unknown>; id: string }): UnifiedSearchDoc {
    if (!doc) return { id: "", type: "", status: "" };
    const isSnapshot = "data" in doc && typeof doc.data === "function";
    const data = isSnapshot ? (doc.data as () => Record<string, unknown>)() : (doc as Record<string, unknown>);
    const docId = isSnapshot ? (doc as { id: string }).id : (((doc as Record<string, unknown>).id as string) || ((doc as Record<string, unknown>).objectID as string) || "");

    return {
      id: docId,
      title: (data.title as string) || (data.name as string) || (data.companyName as string) || "Oglas",
      price: data.price,
      currency: (data.currency as string) || "EUR",
      location: (data.location as string) || (data.locationSlug as string) || "",
      locationSlug: (data.locationSlug as string) || "",
      city: (data.city as string) || "",
      createdAt: (data.createdAt as string | number) || "",
      status: (data.status as string) || "",
      type: (data.type as string) || "",
      typeSlug: (data.typeSlug as string) || "",
      isPremium: (data.isPremium as boolean) || false,
      isUrgent: (data.isUrgent as boolean) || false,
      isPremiumPartner: (data.isPremiumPartner as boolean) || false,
      isVerified: (data.isVerified as boolean) || false,
      salary: data.salary,
      salaryRate: (data.salaryRate as string) || "",
      comp: (data.comp as string) || "",
      logo: (data.logo as string) || "",
      images: Array.isArray(data.images) ? (data.images.slice(0, 3) as string[]) : [],
      authorId: (data.authorId as string) || "",
      companyId: (data.companyId as string) || "",
      description: (data.description as string) || (data.opis as string) || "",
      role: (data.role as string) || "",
      profession: (data.profession as string) || "",
      professionSlug: (data.professionSlug as string) || "",
      beds: data.beds,
      accommodationType: (data.accommodationType as string) || "",
      jobType: (data.jobType as string) || "",
      viewsCount: (data.viewsCount as number) || 0,
      distance: typeof data._distance === "number" ? Math.round(data._distance / 1000) : null, // convert meters to km
      loc: (data.loc as string) || (data.location as string) || (data.locationSlug as string) || "",
      sal: (data.sal as string) || (data.salary as string) || "",
      benefits: Array.isArray(data.benefits) ? (data.benefits as string[]) : [],
      benefiti: Array.isArray(data.benefiti) ? (data.benefiti as string[]) : [],
      rawBenefits: Array.isArray(data.rawBenefits) ? (data.rawBenefits as string[]) : [],
      plataMin: data.plataMin,
      plataMax: data.plataMax,
      salaryType: data.salaryType,
      smestaj: data.smestaj,
      prevoz: data.prevoz,
      hrana: data.hrana,
      housing: data.housing,
      transport: data.transport,
      food: data.food,
      topliObrok: data.topliObrok
    };
  }
}
