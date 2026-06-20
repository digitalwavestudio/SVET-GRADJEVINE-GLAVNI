const {JWT}=require('google-auth-library');const https=require('https');const fs=require('fs');const path=require('path');
const kp=path.join(process.env.USERPROFILE,'AppData','Roaming','gcloud','legacy_credentials','firebase-adminsdk-fbsvc@gen-lang-client-0548525213.iam.gserviceaccount.com','adc.json');
const sa=JSON.parse(fs.readFileSync(kp,'utf-8'));
const crypto=require('crypto');

function md5(s){return crypto.createHash('md5').update(s).digest('hex')}

// Search cache keys that might have stale mock data
const keys = [
  // SWR search cache for premium jobs queries (various hash values)
  'unified_search_job_',
  'swr:unified_search_job_',
  'swr_backoff:unified_search_job_',
  // Also cache the non-keyed variants  
  'unified_search_jobs_',
  'swr:unified_search_jobs_',
  // List pages
  'unified_search_machines_',
  'unified_search_accommodations_',
  'unified_search_caterings_',
  'unified_search_plots_',
  'unified_search_marketplace_',
  'unified_search_realEstate_',
  'swr:unified_search_machines_',
  'swr:unified_search_accommodations_',
  'swr:unified_search_caterings_',
  'swr:unified_search_plots_',
  'swr:unified_search_marketplace_',
  'swr:unified_search_realEstate_',
  'fallback_search_',
  'swr:fallback_search_',
];

// Also try with "beograd:" prefix
const ALL = [];
for (const k of keys) {
  ALL.push(k);
  ALL.push(`beograd:${k}`);
}

async function firestore(m, p, b) {
  return new Promise((r,j)=>{
    const o={hostname:'firestore.googleapis.com',path:`/v1/projects/gen-lang-client-0548525213/databases/(default)/documents${p}`,method:m,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'}};
    if(b)o.headers['Content-Length']=Buffer.byteLength(b);
    const q=https.request(o,s=>{let d='';s.on('data',c=>d+=c);s.on('end',()=>r(JSON.parse(d)))});q.on('error',j);
    if(b)q.write(b);q.end()
  })
}

async function listAll() {
  let all = [];
  let nextToken = null;
  do {
    let url = `/cache_store_v2?pageSize=200`;
    if (nextToken) url += `&pageToken=${nextToken}`;
    const res = await firestore('GET', url);
    if (res.documents) all = all.concat(res.documents);
    nextToken = res.nextPageToken || null;
  } while (nextToken);
  return all;
}

async function main() {
  const a=new JWT({email:sa.client_email,key:sa.private_key,scopes:['https://www.googleapis.com/auth/datastore']});
  const t=await a.getAccessToken();token=t.token;
  
  // List ALL cache entries
  console.log('Scanning cache_store_v2...');
  const all = await listAll();
  console.log(`Total cache entries: ${all.length}`);
  
  // Find matching keys
  const toDelete = all.filter(doc => {
    const name = doc.name;
    const data = doc.fields?.key?.stringValue || '';
    // Check if data matches our prefixes
    return keys.some(prefix => data.startsWith(prefix));
  });
  
  console.log(`Matching entries: ${toDelete.length}`);
  for (const doc of toDelete) {
    const dataKey = doc.fields?.key?.stringValue || doc.name.split('/').pop();
    console.log(`  DELETE ${doc.name.split('/').pop()} (${dataKey})`);
    await firestore('DELETE', `/${doc.name.split('/documents/')[1]}`).catch(() => {});
  }
  console.log('Done!');
}
let token;
main().catch(e=>console.error(e.message));
