const {JWT}=require('google-auth-library');const https=require('https');const fs=require('fs');const path=require('path');
const kp=path.join(process.env.USERPROFILE,'AppData','Roaming','gcloud','legacy_credentials','firebase-adminsdk-fbsvc@gen-lang-client-0548525213.iam.gserviceaccount.com','adc.json');
const sa=JSON.parse(fs.readFileSync(kp,'utf-8'));
const crypto=require('crypto');

function md5(s){return crypto.createHash('md5').update(s).digest('hex')}

const KNOWN = [
  // From the Cloud Run log: swr:homepage_bff_web_v5
  'swr:homepage_bff_web_v5',
  // SWR envelope for promoted
  'swr:promoted_v2__premium_12',
  'swr:promoted_v2_urgent__12',
  'swr:promoted_v2__12',
  // Possible variants
  'swr:promoted_v2_premium_12',
  'swr:promoted_v2_urgent_12',
  'swr:promoted_v2_12',
  // BFF homepage non-SWR variants
  'homepage_bff_web_v5',
  // Backoff keys
  'swr_backoff:homepage_bff_web_v5',
  'swr_backoff:promoted_v2__premium_12',
  'swr_backoff:promoted_v2_premium_12',
];

// Also try with "beograd:" prefix (default region)
const ALL = [...KNOWN];
for (const k of KNOWN) {
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

async function main() {
  const a=new JWT({email:sa.client_email,key:sa.private_key,scopes:['https://www.googleapis.com/auth/datastore']});
  const t=await a.getAccessToken();token=t.token;
  
  const unique = [...new Set(ALL)];
  console.log(`Attempting to delete ${unique.length} cache keys...`);
  
  let deleted=0, missing=0;
  for (const key of unique) {
    const id = md5(key);
    const res = await firestore('DELETE', `/cache_store_v2/${id}`).catch(() => ({error:{message:'DELETE failed'}}));
    if (res.error) {
      if (res.error.code === 404) { missing++; }
      else { console.log(`  ERR ${id} (${key}): ${res.error.message}`); }
    } else {
      deleted++;
      console.log(`  DELETED ${id} (${key})`);
    }
  }
  console.log(`\nDone: ${deleted} deleted, ${missing} not found, ${unique.length - deleted - missing} errors`);
}
let token;
main().catch(e=>console.error(e.message));
