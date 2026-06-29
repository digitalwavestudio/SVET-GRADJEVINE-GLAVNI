const fs = require('fs');

function fixImportType(filePath) {
  let c = fs.readFileSync(filePath, 'utf8');
  c = c.replace(
    'import {\n  UnifiedSearchResult, \n  UnifiedSearchFilters,\n  UnifiedSearchDoc \n} from "../unified-search.service.ts";',
    'import type {\n  UnifiedSearchResult, \n  UnifiedSearchFilters,\n  UnifiedSearchDoc \n} from "../unified-search.service.ts";'
  );
  c = c.replace(
    'import { UnifiedSearchResult, UnifiedSearchFilters, UnifiedSearchDoc } from "../unified-search.service.ts";',
    'import type { UnifiedSearchResult, UnifiedSearchFilters, UnifiedSearchDoc } from "../unified-search.service.ts";'
  );
  fs.writeFileSync(filePath, c);
}

fixImportType('server/services/unified-search/unified-search-algolia.service.ts');
fixImportType('server/services/unified-search/unified-search-firestore.service.ts');
fixImportType('server/services/unified-search/unified-search-utils.service.ts');

console.log("Fixed import types to break circular dependency");