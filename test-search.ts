import { UnifiedSearchService } from './server/services/unified-search.service';
import { db } from './server/config/firebase';

async function run() {
  console.log("Starting search...");
  try {
    const res = await UnifiedSearchService.search('companies', {});
    console.log("Got results:", res.docs.length);
    if(res.docs.length > 0) {
      console.log(res.docs[0]);
    }
  } catch(e) {
    console.error(e);
  }
}
run();
