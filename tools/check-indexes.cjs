const {JWT}=require('google-auth-library');const https=require('https');const fs=require('fs');const path=require('path');
const kp=path.join(process.env.USERPROFILE,'AppData','Roaming','gcloud','legacy_credentials','firebase-adminsdk-fbsvc@gen-lang-client-0548525213.iam.gserviceaccount.com','adc.json');
const sa=JSON.parse(fs.readFileSync(kp,'utf-8'));
async function api(h,p,m,t){return new Promise((r,j)=>{const o={hostname:h,path:p,method:m,headers:{Authorization:`Bearer ${t}`}};const q=https.request(o,s=>{let d='';s.on('data',c=>d+=c);s.on('end',()=>r(JSON.parse(d)))});q.on('error',j);q.end()})}
async function main(){const a=new JWT({email:sa.client_email,key:sa.private_key,scopes:['https://www.googleapis.com/auth/datastore']});const{token}=await a.getAccessToken();const idx=await api('firestore.googleapis.com','/v1/projects/gen-lang-client-0548525213/databases/(default)/collectionGroups/listings/indexes','GET',token);
if(idx.indexes){idx.indexes.forEach(i=>{const f=i.fields.map(f=>`${f.fieldPath}:${f.order||f.arrayConfig}`).join(', ');console.log(`${i.queryScope} | ${f}`)})}else console.log(JSON.stringify(idx,null,2))}
main().catch(e=>console.error(e.message));
