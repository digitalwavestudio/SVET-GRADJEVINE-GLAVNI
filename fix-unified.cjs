const fs = require('fs');

const typeContent = `
export interface UnifiedSearchDoc {
  id: string;
  type: string;
  status: string;
  [key: string]: unknown;
}

export interface UnifiedSearchFilters {
  search?: string;
  category?: string;
  location?: string;
  priceMin?: number;
  priceMax?: number;
  [key: string]: unknown;
}

export interface UnifiedSearchResult {
  hits: UnifiedSearchDoc[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  metadata?: Record<string, unknown>;
}
`;
fs.writeFileSync('server/services/unified-search/unified-search-types.ts', typeContent);

let service = fs.readFileSync('server/services/unified-search.service.ts', 'utf8');
service = service.replace(/export interface UnifiedSearchDoc \{[\s\S]*?\}\s*export interface UnifiedSearchFilters \{[\s\S]*?\}\s*export interface UnifiedSearchResult \{[\s\S]*?\}/, 'export { UnifiedSearchDoc, UnifiedSearchFilters, UnifiedSearchResult } from "./unified-search/unified-search-types.ts";');
fs.writeFileSync('server/services/unified-search.service.ts', service);

let utilService = fs.readFileSync('server/services/unified-search/unified-search-utils.service.ts', 'utf8');
utilService = utilService.replace('import type { UnifiedSearchDoc, UnifiedSearchFilters, UnifiedSearchResult } from "../unified-search.service.ts";', 'import type { UnifiedSearchDoc, UnifiedSearchFilters, UnifiedSearchResult } from "./unified-search-types.ts";');
utilService = utilService.replace('import { UnifiedSearchDoc, UnifiedSearchFilters, UnifiedSearchResult } from "../unified-search.service.ts";', 'import type { UnifiedSearchDoc, UnifiedSearchFilters, UnifiedSearchResult } from "./unified-search-types.ts";');
fs.writeFileSync('server/services/unified-search/unified-search-utils.service.ts', utilService);

let algoliaService = fs.readFileSync('server/services/unified-search/unified-search-algolia.service.ts', 'utf8');
algoliaService = algoliaService.replace(/import type \{\s*UnifiedSearchResult,\s*UnifiedSearchFilters,\s*UnifiedSearchDoc\s*\} from "\.\.\/unified-search\.service\.ts";/g, 'import type { UnifiedSearchResult, UnifiedSearchFilters, UnifiedSearchDoc } from "./unified-search-types.ts";');
fs.writeFileSync('server/services/unified-search/unified-search-algolia.service.ts', algoliaService);

let firestoreService = fs.readFileSync('server/services/unified-search/unified-search-firestore.service.ts', 'utf8');
firestoreService = firestoreService.replace(/import type \{\s*UnifiedSearchResult,\s*UnifiedSearchFilters,\s*UnifiedSearchDoc\s*\} from "\.\.\/unified-search\.service\.ts";/g, 'import type { UnifiedSearchResult, UnifiedSearchFilters, UnifiedSearchDoc } from "./unified-search-types.ts";');
fs.writeFileSync('server/services/unified-search/unified-search-firestore.service.ts', firestoreService);

console.log("Moved unified-search types to break circular dependency");