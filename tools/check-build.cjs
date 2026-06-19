const {JWT} = require('google-auth-library');
const https = require('https');
const fs = require('fs');
const path = require('path');
const keyPath = path.join(process.env.USERPROFILE, 'AppData', 'Roaming', 'gcloud', 'legacy_credentials',
  'firebase-adminsdk-fbsvc@gen-lang-client-0548525213.iam.gserviceaccount.com', 'adc.json');
const sa = JSON.parse(fs.readFileSync(keyPath, 'utf-8'));
async function call(h,p,m,t){return new Promise((r,j)=>{const o={hostname:h,path:p,method:m,headers:{Authorization:`Bearer ${t}`}};const q=https.request(o,s=>{let d='';s.on('data',c=>d+=c);s.on('end',()=>r(JSON.parse(d)))});q.on('error',j);q.end()})}
async function main(){const a=new JWT({email:sa.client_email,key:sa.private_key,scopes:['https://www.googleapis.com/auth/cloud-platform']});const{token}=await a.getAccessToken();const b=await call('cloudbuild.googleapis.com',`/v1/projects/gen-lang-client-0548525213/builds?pageSize=1&filter=substitutions.COMMIT_SHA%3D%22ae446cf9d59858b1d9f2de18e05d577cb9d42289%22`,'GET',token);const bl=b.builds?.[0];if(bl)console.log(`Status: ${bl.status}\nStart: ${bl.startTime}`);else console.log('BUILD_NOT_FOUND')}
main().catch(e=>console.error('ERR',e.message));
