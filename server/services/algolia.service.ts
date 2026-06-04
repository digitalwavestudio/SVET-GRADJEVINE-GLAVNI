import { env } from "../config/env.ts";
import { getErrorMessage } from "../utils/error-handler.ts";

export interface AdAlgoliaRecord {
  objectID: string;
  title: string;
  price?: number | string;
  currency: string;
  location?: string;
  locationSlug?: string;
  city?: string;
  createdAt?: number | string;
  status: string;
  type?: string;
  typeSlug?: string;
  isPremium?: boolean;
  isUrgent?: boolean;
  isPremiumPartner?: boolean;
  isVerified?: boolean;
  salary?: string | number;
  salaryRate?: string;
  comp?: string;
  authorId?: string;
  companyId?: string;
  role?: string;
  profession?: string;
  professionSlug?: string;
  beds?: number;
  accommodationType?: string;
  jobType?: string;
  viewsCount: number;
  categorySlug?: string;
  sectorSlug?: string;
  areaM2?: number;
  tacnaLokacija?: string;
  _geoloc?: { lat: number; lng: number };
  images?: string[];
  logo?: string;
  _isPartialUpdate?: boolean;
}

export interface ArticleAlgoliaRecord {
  objectID: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  category?: string;
  tags?: string[];
  publishedAt?: number | string;
  viewCount: number;
  status: string;
}

export interface AlgoliaHit {
  objectID: string;
  id?: string;
  title?: string;
  name?: string;
  companyName?: string;
  price?: number | string;
  currency?: string;
  location?: string;
  locationSlug?: string;
  city?: string;
  createdAt?: string | number;
  status?: string;
  type?: string;
  typeSlug?: string;
  isPremium?: boolean;
  isUrgent?: boolean;
  isPremiumPartner?: boolean;
  isVerified?: boolean;
  salary?: number | string;
  salaryRate?: string;
  comp?: string;
  logo?: string;
  images?: string[];
  authorId?: string;
  companyId?: string;
  role?: string;
  profession?: string;
  professionSlug?: string;
  beds?: number | string;
  accommodationType?: string;
  jobType?: string;
  viewsCount?: number;
  _distance?: number;
  slug?: string;
  excerpt?: string;
  featuredImage?: string;
  authorName?: string;
  publishedAt?: string | number;
  viewCount?: number;
}

export interface AlgoliaSearchResponse {
  hits: AlgoliaHit[];
  page: number;
  nbPages: number;
  nbHits?: number;
}

export interface AlgoliaIndex {
  search: (query: string, options: Record<string, unknown>) => Promise<AlgoliaSearchResponse>;
  saveObject: (obj: Record<string, unknown>) => Promise<unknown>;
  deleteObject: (id: string) => Promise<unknown>;
}

export interface AlgoliaRequest {
  indexName: string;
  query: string;
  hitsPerPage?: number;
  page?: number;
  filters?: string;
  queryType?: string;
  [key: string]: unknown;
}

export interface AlgoliaSearchResult {
  hits: AlgoliaHit[];
  page: number;
  nbPages: number;
  nbHits: number;
}

export interface AlgoliaClient {
  search: (options: { requests: AlgoliaRequest[] }) => Promise<{ results: AlgoliaSearchResult[] }>;
  saveObject: (options: { indexName: string; body: Record<string, unknown> }) => Promise<unknown>;
  saveObjects: (options: { indexName: string; objects: Record<string, unknown>[] }) => Promise<unknown>;
  partialUpdateObject?: (options: { indexName: string; objectID: string; attributesToUpdate: Record<string, unknown> }) => Promise<unknown>;
  deleteObject: (options: {
    indexName: string;
    objectID: string;
  }) => Promise<unknown>;
  browse?: (options: { indexName: string; browseParams: Record<string, unknown> }) => Promise<unknown>;
  setSettings?: (options: Record<string, unknown>) => Promise<unknown>;
}

const getSelfHealedCredentials = () => {
  const appId = (env.ALGOLIA_APP_ID || "").trim();
  let apiKey = (env.ALGOLIA_API_KEY || "").trim();
  let indexName = (env.ALGOLIA_INDEX_NAME || "listings").trim();

  // Self-Healing: If indexName is configured as a 32-character hex (which is a hash, and cannot be a standard index name like 'listings'), 
  // then the user mistakenly put their Admin/Write API Key inside indexName.
  const isIndexNameAKey = /^[a-f0-9]{32}$/i.test(indexName);
  if (isIndexNameAKey) {
    apiKey = indexName;
    indexName = "listings";
  }

  return { appId, apiKey, indexName };
};

let algoliaClient: AlgoliaClient | null = null;

export const initAlgolia = async (): Promise<AlgoliaClient | null> => {
  const { appId, apiKey } = getSelfHealedCredentials();

  if (!appId || !apiKey) {
    return null;
  }

  if (!algoliaClient) {
    try {
      const { algoliasearch } = await import("algoliasearch");
      algoliaClient = algoliasearch(appId, apiKey) as unknown as AlgoliaClient;
    } catch (err) {
      console.error("Failed to initialize Algolia client", err);
      return null;
    }
  }

  return algoliaClient;
};

// Resiliency helper: ensuring we don't use the App ID or API Key as an index name by mistake
const getValidIndexName = (indexName: string): string => {
  let target = (indexName || "").trim();
  const { indexName: defaultIndex, appId, apiKey } = getSelfHealedCredentials();

  const commonCategories = [
    "jobs",
    "machines",
    "accommodations",
    "caterings",
    "plots",
    "marketplace",
    "realEstate",
    "job",
    "machine",
    "accommodation",
    "catering",
    "plot",
    "articles",
    "magazine",
    "magazine_index",
  ];
  if (commonCategories.includes(target) && target !== "articles" && target !== "magazine" && target !== "magazine_index") {
    target = "listings";
  }
  
  if (target === "magazine" || target === "articles") {
    target = "magazine_index";
  }

  if (!target || target === "undefined" || target === "null") {
    return defaultIndex;
  }

  // If it matches App ID or API Key, or looks like a 32-char hex (API Key), fallback to env default or 'listings'
  const isHash = /^[a-f0-9]{32}$/i.test(target);
  if (
    target === appId ||
    target === apiKey ||
    isHash
  ) {
    return defaultIndex !== target
      ? defaultIndex
      : "listings";
  }

  return target === "listings" ? defaultIndex : target;
};

export const searchAdsIndex = async (
  indexName: string,
  query: string,
  page: number,
  facetFilters: string[] = [],
  pageSize: number = 20,
  numericFilters: string[] = [],
  extraParams: Record<string, unknown> = {},
): Promise<AlgoliaSearchResponse | null> => {
  const client = await initAlgolia();
  if (!client) return null;

  const targetIndex = getValidIndexName(indexName);

  // Base filters include active status
  const baseFilters = "status:active";
  const combinedFacetFilters =
    facetFilters.length > 0 ? `(${facetFilters.join(" AND ")})` : "";
  const combinedNumericFilters =
    numericFilters.length > 0 ? `(${numericFilters.join(" AND ")})` : "";

  const filterParts = [baseFilters];
  if (combinedFacetFilters) filterParts.push(combinedFacetFilters);
  if (combinedNumericFilters) filterParts.push(combinedNumericFilters);

  const combinedFilters = filterParts.join(" AND ");

  try {
    const response = await client.search({
      requests: [
        {
          indexName: targetIndex,
          query,
          hitsPerPage: pageSize,
          page,
          filters: combinedFilters,
          queryType: "prefixAll",
          ...extraParams,
        },
      ],
    });

    const result = response.results[0];
    return {
      hits: (result.hits || []) as AlgoliaHit[],
      page: (result.page || 0) as number,
      nbPages: (result.nbPages || 0) as number,
      nbHits: (result.nbHits || 0) as number,
    };
  } catch (err: unknown) {
    const errorMsg = getErrorMessage(err);
    if (errorMsg.includes("does not exist") || errorMsg.includes("Index")) {
      return { hits: [], page: 0, nbPages: 0 };
    }
    console.error(
      `Algolia search failed for ${targetIndex}. Error: ${errorMsg}`,
    );
    return null;
  }
};

interface Geoloc {
  lat: number;
  lng: number;
}
interface Geopoint {
  latitude: number;
  longitude: number;
}

export const projectForAlgolia = (doc: Record<string, unknown>): Partial<AdAlgoliaRecord> => {
  if (!doc) return {};
  
  const geopoint = doc.geopoint as Geopoint | undefined;
  const _geoloc = doc._geoloc as Geoloc | undefined;

  const payload: Partial<AdAlgoliaRecord> = {
    title: (doc.title as string | undefined) || (doc.name as string | undefined) || (doc.companyName as string | undefined) || "Oglas",
    price: doc.price as number | string | undefined,
    currency: (doc.currency as string | undefined) || "EUR",
    location: (doc.location as string | undefined) || (doc.locationSlug as string | undefined),
    locationSlug: doc.locationSlug as string | undefined,
    city: doc.city as string | undefined,
    createdAt: doc.createdAt as string | number | undefined,
    status: (doc.status as string) || "",
    type: doc.type as string | undefined,
    typeSlug: doc.typeSlug as string | undefined,
    isPremium: doc.isPremium as boolean | undefined,
    isUrgent: doc.isUrgent as boolean | undefined,
    isPremiumPartner: doc.isPremiumPartner as boolean | undefined,
    isVerified: doc.isVerified as boolean | undefined,
    salary: doc.salary as string | number | undefined,
    salaryRate: doc.salaryRate as string | undefined,
    comp: doc.comp as string | undefined,
    authorId: doc.authorId as string | undefined,
    companyId: doc.companyId as string | undefined,
    role: doc.role as string | undefined,
    profession: doc.profession as string | undefined,
    professionSlug: doc.professionSlug as string | undefined,
    beds: doc.beds as number | undefined,
    accommodationType: doc.accommodationType as string | undefined,
    jobType: doc.jobType as string | undefined,
    viewsCount: (doc.viewsCount as number | undefined) || 0,
    categorySlug: doc.categorySlug as string | undefined,
    sectorSlug: doc.sectorSlug as string | undefined,
    areaM2: doc.areaM2 as number | undefined,
    tacnaLokacija: doc.tacnaLokacija as string | undefined,
    _geoloc: geopoint ? { lat: geopoint.latitude, lng: geopoint.longitude } : _geoloc,
  };

  const images = doc.images as string[] | undefined;
  if (images && Array.isArray(images) && images.length > 0) {
     payload.images = [images[0]];
  } else {
     payload.images = [];
  }
  
  if (doc.logo) {
    payload.logo = doc.logo as string;
  }

  // Remove undefined properties
  return Object.fromEntries(
    Object.entries(payload).filter(([_, v]) => v !== undefined)
  ) as Partial<AdAlgoliaRecord>;
};

export const syncAdToIndex = async (
  indexName: string,
  adId: string,
  adData: Record<string, unknown>,
): Promise<void> => {
  const targetIndex = getValidIndexName(indexName);

  if (adData.status !== "active") {
    await deleteAdFromIndex(targetIndex, adId);
    return;
  }

  const client = await initAlgolia();
  if (!client) return;

  try {
    // Partial Update check
    if (adData._isPartialUpdate && client.partialUpdateObject) {
       const { _isPartialUpdate, ...updatePayload } = projectForAlgolia(adData);
       await client.partialUpdateObject({
         indexName: targetIndex,
         objectID: adId,
         attributesToUpdate: updatePayload
       });
       return;
    }

    const cleanData = projectForAlgolia(adData);
    await client.saveObject({
      indexName: targetIndex,
      body: { objectID: adId, ...cleanData },
    });
  } catch (err: unknown) {
    console.error(
      `Algolia sync failed for ${adId} in ${targetIndex}. Error: ${getErrorMessage(err)}`,
    );
  }
};

export const syncAdsToIndex = async (
  indexName: string,
  objects: { id: string; data: Record<string, unknown> }[],
): Promise<void> => {
  if (!objects || objects.length === 0) return;

  const targetIndex = getValidIndexName(indexName);
  const client = await initAlgolia();
  if (!client) return;

  try {
    const activeList = objects.filter((obj) => obj.data.status === "active");

    const fullObjects = activeList
      .filter(obj => !obj.data._isPartialUpdate)
      .map((obj) => ({
        objectID: obj.id,
        ...projectForAlgolia(obj.data),
      }));

    const partialObjects = activeList
      .filter(obj => obj.data._isPartialUpdate)
      .map((obj) => {
        const { _isPartialUpdate, ...updatePayload } = projectForAlgolia(obj.data);
        return {
          objectID: obj.id,
          ...updatePayload
        };
      });

    const inactiveIds = objects
      .filter((obj) => obj.data.status !== "active")
      .map((obj) => obj.id);

    // Using client.saveObjects for full updates
    if (fullObjects.length > 0) {
      await client.saveObjects({
        indexName: targetIndex,
        objects: fullObjects,
      });
    }

    // Using client.partialUpdateObject logic for partials (or saveObjects if SDK supports partialUpdateObjects, but some v5 clients don't have it natively in typical interface, fallback to map if missing)
    if (partialObjects.length > 0) {
      const clientAny = client as { partialUpdateObjects?: (args: unknown) => Promise<unknown> };
      if (clientAny.partialUpdateObjects) {
         await clientAny.partialUpdateObjects({ indexName: targetIndex, objects: partialObjects, createIfNotExists: true });
      } else if (client.partialUpdateObject) {
         for (const p of partialObjects) {
            await client.partialUpdateObject({ indexName: targetIndex, objectID: p.objectID, attributesToUpdate: p });
         }
      } else {
         // fallback to normal saveObjects if SDK does not support partial natively
         await client.saveObjects({ indexName: targetIndex, objects: partialObjects });
      }
    }

    if (inactiveIds.length > 0) {
      for (const id of inactiveIds) {
        await client.deleteObject({ indexName: targetIndex, objectID: id });
      }
    }
  } catch (err: unknown) {
    console.error(
      `Algolia batch sync failed for ${targetIndex}. Error: ${getErrorMessage(err)}`,
    );
  }
};

export const deleteAdFromIndex = async (
  indexName: string,
  adId: string,
): Promise<void> => {
  const targetIndex = getValidIndexName(indexName);

  const client = await initAlgolia();
  if (!client) return;

  try {
    await client.deleteObject({
      indexName: targetIndex,
      objectID: adId,
    });
  } catch (err: unknown) {
    console.warn(
      `Failed to delete object ${adId} from ${targetIndex}. Error: ${getErrorMessage(err)}`,
    );
  }
};

export const syncArticleToIndex = async (
  articleId: string,
  articleData: Record<string, unknown>,
): Promise<void> => {
  if (articleData.status !== "published") {
    await deleteAdFromIndex("magazine_index", articleId);
    return;
  }

  const client = await initAlgolia();
  if (!client) return;

  try {
    const payload = {
      objectID: articleId,
      title: (articleData.title as string) || "",
      slug: (articleData.slug as string) || "",
      excerpt: (articleData.excerpt as string) || "",
      content: (articleData.content as string) || "",
      category: (articleData.category as string) || "",
      tags: (articleData.tags as string[]) || [],
      publishedAt: (articleData.publishedAt as string | number) || "",
      viewCount: (articleData.viewCount as number) || 0,
      status: (articleData.status as string) || "",
    };

    await client.saveObject({
      indexName: "magazine_index",
      body: payload,
    });
  } catch (err: unknown) {
    console.error(`Algolia article sync failed for ${articleId}. Error: ${getErrorMessage(err)}`);
  }
};

export const syncArticlesToIndex = async (
    articles: { id: string; data: Record<string, unknown> }[]
): Promise<void> => {
    const client = await initAlgolia();
    if (!client) return;

    try {
        const objects = articles.map(a => ({
            objectID: a.id,
            title: (a.data.title as string) || "",
            slug: (a.data.slug as string) || "",
            excerpt: (a.data.excerpt as string) || "",
            content: (a.data.content as string) || "",
            category: (a.data.category as string) || "",
            tags: (a.data.tags as string[]) || [],
            publishedAt: (a.data.publishedAt as string | number) || "",
            viewCount: (a.data.viewCount as number) || 0,
            status: (a.data.status as string) || "",
        }));

        await client.saveObjects({
            indexName: "magazine_index",
            objects,
        });
    } catch (err: unknown) {
        console.error(`Algolia bulk article sync failed. Error: ${getErrorMessage(err)}`);
    }
};

export const searchJobsIndex = async (
  query: string,
  page: number,
  facetFilters: string[] = [],
  pageSize: number = 20,
): Promise<AlgoliaSearchResponse | null> => {
  return searchAdsIndex(
    env.ALGOLIA_INDEX_NAME,
    query,
    page,
    facetFilters,
    pageSize,
  );
};

export const browseIndicesObjects = async (
  indexName: string,
  callback: (hits: AlgoliaHit[]) => Promise<void>,
): Promise<void> => {
  const client = await initAlgolia();
  if (!client) return;

  try {
    // Fallback search-based browsing for v5
    let page = 0;
    const MAX_PAGES = 100; // 🛡️ [SECURITY-GUARD] Prevencija beskonačne Node.js petlje
    while (page < MAX_PAGES) {
      const res = await searchAdsIndex(indexName, "", page, [], 1000);
      if (!res || !res.hits || res.hits.length === 0) break;
      await callback(res.hits);
      if (page >= res.nbPages - 1) break;
      page++;
    }
  } catch (err) {
    console.error(`Algolia browse failed for ${indexName}`, err);
  }
};

export const syncJobToIndex = async (
  jobId: string,
  jobData: Record<string, unknown>,
): Promise<void> => {
  return syncAdToIndex(env.ALGOLIA_INDEX_NAME, jobId, jobData);
};

export const setupAlgoliaIndexSettings = async (): Promise<boolean> => {
  const client = await initAlgolia();
  if (!client) return false;

  const indices = [
    env.ALGOLIA_INDEX_NAME || "listings",
    "companies",
    "masters",
    "articles",
  ];

  try {
    for (const indexName of indices) {
      const targetIndex = getValidIndexName(indexName);
      console.log(`Configuring Algolia index settings: ${indexName} -> ${targetIndex}`);
      if (client.setSettings) {
        const isMagazine = targetIndex === "magazine_index";
        await client.setSettings({
          indexName: targetIndex,
          indexSettings: {
            searchableAttributes: isMagazine ? [
               "unordered(title)",
               "unordered(excerpt)",
               "unordered(content)",
               "unordered(tags)",
            ] : [
              "unordered(title)",
              "unordered(name)",
              "unordered(companyName)",
              "unordered(tacnaLokacija)",
            ],
            attributesForFaceting: isMagazine ? [
               "filterOnly(category)",
               "filterOnly(status)",
               "filterOnly(authorId)",
            ] : [
              "filterOnly(status)",
              "filterOnly(categorySlug)",
              "filterOnly(sectorSlug)",
              "filterOnly(professionSlug)",
              "filterOnly(typeSlug)",
              "filterOnly(role)",
              "areaM2", 
              "price",
            ],
            customRanking: isMagazine ? [
               "desc(publishedAt)",
               "desc(viewCount)",
            ] : [
              "desc(isPremium)",
              "desc(isUrgent)",
              "desc(createdAt)",
            ],
            typoTolerance: "min",
          },
        });
      }
    }
    return true;
  } catch (err: unknown) {
    console.error(`Failed to setup Algolia settings: ${getErrorMessage(err)}`);
    return false;
  }
};
