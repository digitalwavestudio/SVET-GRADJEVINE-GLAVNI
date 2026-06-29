# Agents Protocol

## Pravila

1. **Jezik** — uvek pišem na srpskom (latinica)
2. **Objašnjenja** — normalnim jezikom, DOZVOLJEN žargon
3. **GitHub** — kad kažeš "šalji na GitHub", odmah commit i push CEO CODE na main GRANU, bez pitanja
4. **Ne šalji na cloud** — nikad ne guram BUILD na Cloud! NIKAD!

## Firestore Indexes

Deploy to default database:
  firebase deploy --only firestore:indexes

**IMPORTANT**: App uses `ai-studio` database (not `(default)`). The `firebase deploy` only targets `(default)`. To deploy indexes to `ai-studio`, use `gcloud firestore indexes composite create` or the REST API directly.

78 indexes defined in `firestore.indexes.json`. All 78 are deployed to `ai-studio` (verifed 2026-06-28, all returned ALREADY_EXISTS).

## SEO / Rate Limiting

AhrefsBot moved from BAD_BOTS to whitelisted search bots (`rate-limit-shield.middleware.ts`). SPA passthrough added for `/pretraga`, `/profil/*`, `/cene-i-statistika/*` so React Router can handle them instead of returning 404.

## Ahrefs SEO Fixes (Session 3)

### Canonical URL
- **`spa.middleware.ts:1293`** — SPA passthrough (`/postavi-oglas`, `/pretraga`, `/profil`) sada dodaje `<link rel="canonical">` umesto slanja gole `index.html`
- **`spa.middleware.ts:1084`** — Non-bot listing canonical: umesto `CANONICAL_PATH_MAP[collectionName]` (= `/poslovi` za sve), sada koristi `isPseoRoute ? req.path : ...` tako da geo hubovi (npr. `/poslovi/zidar/krusevac`) imaju canonical na tačan URL
- **`spa.middleware.ts:1149`** — Isti fix za skeleton fallback path

### Missing Title (Ahrefs "Missing")
- **`spa.middleware.ts:1192-1194`** — Non-bot detail page slao `cachedIndexHtml` bez izmene title-a. Sada generiše slug-based title (npr. "Rukovalac Viljukarom Beograd | Svet Građevine")

### 410 Gone na hub stranama
- **`seo.middleware.ts:251`** — Uklonjen `detailEntityTypes` check. Svaki URL bez `~` u poslednjem segmentu se tretira kao hub strana i prosleđuje na `seoRouter` umesto da ide u `getAdMetaData` koji vraća 410

## Page Speed / SSR

- **`spa.middleware.ts:952-1004`** — Homepage: uklonjen `if (!isBot)` guard. Sada React SSR radi za SVE posetioce (ne samo botove). Clean shell je samo fallback ako SSR failuje.
- **`spa.middleware.ts:1021-1089`** — Listing pages: isto — try SSR za svakoga, bot fallback vs non-bot clean shell.

Pre: non-bot human dobijao prazan `<div id="root">` → 11.7s FCP dok JS ne hydratuje.
Posle: HTML dolazi sa pre-rendered content-om → FCP dramatično bolji.

## Cloud Run / Infra

- **Memory**: 1GB (512MB nije dovoljno — OOM SIGABRT kad Redis padne)
- **Concurrency**: 40 (sa 80 je pritisak prevelik po instanci)
- **VPC Connector**: `svet-gradevine-connector` (us-west1, range 10.8.0.0/28)
- **Cloud NAT**: `svet-gradevine-nat` sa statičkom IP `8.235.34.194`
- **Cloud Router**: `svet-gradevine-router`
- **Redis host**: `spotted-loaf-funny-63490.db.redis.io:14446` — zaštićen lozinkom, firewall mora da pusti Cloud Run egress (static IP gore)

Ako deploy ruši **503 / SIGABRT**, prvo proveri Redis konekciju. Ako Redis ne radi, app radi u in-memory modu i troši više RAM-a.

## 🛑 PREMIUM JOBS FIX (Session 4 — commit 85dc579) — NE DIRATI!

⚠️ **Ovo je build koji radi! Ako se premium oglasi ili lista oglasa ponovo sjebu, vrati se na ovaj commit!**

### Problem (pre fixa)
1. **Premium poslovi nisu bili na `/poslovi`** — homepage ih je prikazivao (4 premium posla), ali na stranici poslova premium sekcija (`JobsPremium`) je bila prazna
2. **Premium poslovi nisu bili na vrhu glavne liste** — trebalo je da budu prvi u listingu
3. **Fast-Path cache je gušio premium upit** — Firestore dokument `metadata/promoted_ads_fastpath` imao je `premium: []` (prazan niz), i sistem je verovao tom praznom nizu umesto da pita Firestore

### Root Cause #1: Fast-Path prazan niz
**Fajl:** `server/services/unified-ads.service.ts` (linija 63-69)

`getCachedMetadata()` je čitao Fast-Path dokument iz Firestore-a (`metadata/promoted_ads_fastpath`). Na njemu je polje `premium: []` (prazan niz). JS tretira `[]` kao truthy, pa je `actualData = []` i sistem je vraćao prazan niz — **bez da ikad pozove pravi Firestore upit**.

Kad je Firestore bio spor (>100ms), Fast-Path timeout od 100ms je istekao i sistem je ipak pitao pravu bazu — zato je juče radilo a danas ne (posle deploy-a indeksa, Firestore je brži od 100ms).

**Fix:** Dodata provera `if (Array.isArray(actualData) && actualData.length === 0)` — ako je prazan niz, ignoriše se i ide na pravi upit.

### Root Cause #2: Premium poslovi nisu u prvih 101
**Fajl:** `server/controllers/jobs.controller.ts` (linija 15) i `src/modules/jobs/pages/JobsPage.tsx`

`getPublicJobs()` vraća prvih N najskorijih poslova po `createdAt DESC`. Premium poslovi su bili stariji od 101. najskorijeg posla → nisu ni učitani → `jobs.filter(j => j.isPremium)` na frontendu prazan.

**Fix (frontend):** Umesto da filtrira premium iz main upita, sada se koristi `usePremiumJobs` hook koji šalje `isPremium: true` filter direktno u Firestore. Dobjjeni premium poslovi se dodaju na početak `allJobsPremiumFirst` niza (bez duplikata po `id`).

### Root Cause #3: Limit 101 je mali
**Fajl:** `server/controllers/jobs.controller.ts` (linija 15)

`pageSize` cap sa 100 podignut na 1000.

### Šta je menjano (4 fajla)

| Fajl | Linija | Promena |
|---|---|---|
| `server/services/unified-ads.service.ts` | 63-69 | Dodata provera za prazan niz u Fast-Path-u |
| `server/services/unified-ads.service.ts` | ~294 | Dodat `[PREMIUM_DEBUG]` log za `getPromotedAds` |
| `server/services/jobs/jobs-core.service.ts` | ~15 | Cache key `v2` bump + debug logovi |
| `server/controllers/jobs.controller.ts` | 15 | `100` → `1000` (max pageSize) |
| `src/modules/jobs/pages/JobsPage.tsx` | 24 | Dodat `usePremiumJobs` import |
| `src/modules/jobs/pages/JobsPage.tsx` | 83-89 | Dodat `usePremiumJobs` hook + `allJobsPremiumFirst` merge |
| `src/modules/jobs/pages/JobsPage.tsx` | 93-94 | `displayedJobs` i `hasMore` koriste `allJobsPremiumFirst` |
| `src/modules/jobs/pages/JobsPage.tsx` | 101 | `totalJobsCount` koristi `allJobsPremiumFirst` |
| `src/modules/jobs/pages/JobsPage.tsx` | 697 | `jobs` prop → `allJobsPremiumFirst` |

### Kako premium poslovi SADA rade (flow)
1. `JobsPage` poziva `usePremiumJobs(sanitizedFilters, 12)` → šalje API zahtev sa `isPremium: true` filterom
2. Backend (`UnifiedSearchService.search("job", filters)`) dodaje `.where("isPremium", "==", true)` na Firestore upit — **ne zavisi od `createdAt` redosleda**
3. Fast-Path više ne vraća prazan niz → pravi upit uvek ide u Firestore
4. Frontend spaja: `allJobsPremiumFirst = [...premiumJobs, ...nonPremiumJobs]`
5. `displayedJobs` i `hasMore` računaju iz `allJobsPremiumFirst`
6. Premium poslovi su na vrhu glavne liste

### Ako se opet sjebe
- **Proveri server log za `[PREMIUM_DEBUG]`** linije — da li se uopšte izvršava premium upit?
- **Proveri Fast-Path:** u Firestore konzoli vidi `metadata/promoted_ads_fastpath` — ako `premium` polje postoji i prazno je, to je uzrok
- **Proveri da li premium poslovi postoje uopšte:** pretraži `listings` kolekciju sa `isPremium == true && type == "job"`
- **Vrati se na commit:** `git checkout 85dc579`

### VAŽNO: NE DIRAJ
- `usePremiumJobs` hook i `allJobsPremiumFirst` merge logiku u `JobsPage.tsx`
- Fast-Path empty array guard u `unified-ads.service.ts`
- pageSize cap 1000 u `jobs.controller.ts`

## 🖥️ LOCALHOST SETUP (Session 5 — fixirano 2026-06-29)

**⚠️ BITNO: Lokalni dev radi SPORO jer je Firestore baza u `us-west1` (Oregon), a ti si u Srbiji. Svaki upit traje 1-15s.**
Online (Cloud Run u Oregon-u) je brz (<10ms). Lokalno je sporo ali radi.

### 🔧 Timeout podešavanja

| Fajl | Linija | Originalno | Fix |
|---|---|---|---|
| `server/services/bff.service.ts` | readFastPathHomepage (41) | 100ms timeout | **15000ms** — da Fast-Path read stigne |
| `server/services/bff.service.ts` | CacheService callback (310) | 10000ms sub-query | **25000ms** — da sveži upit stigne |
| `server/services/bff.service.ts` | search("jobs") limit (85, 377) | 10 | **5** — na naslovnoj 5 poslova |

### 💾 Fast-Path (homepage keš)

Fast-Path dokument je `metadata/homepage_fastpath` u `ai-studio` bazi. Firestore limit je **1MB** — base64 logo polja su ~800KB svako, pa se ne mogu pisati u Fast-Path.

**Kako radi:**
1. BFF prima zahtev
2. Čita Fast-Path sa 15s timeout-om (sporo, ali uspe posle prvog čitanja)
3. Ako Fast-Path ima podatke → vraća instant
4. Background task (`computeAndSaveFastPath`) pokreće svež upit (bez timeout-a)
5. Background task upisuje nove podatke u Fast-Path (ali bez logoa — da stane u 1MB)

**Ako Fast-Path nema podataka (0 poslova):**
```powershell
# Ručno upiši Fast-Path sa trenutnim poslovima
node -e "
const a=require('firebase-admin'),{getFirestore:b}=require('firebase-admin/firestore');
a.initializeApp({credential:a.credential.cert(require('./firebase-service-account.json'))});
const d=b(a.app(),'ai-studio-13fdc921-7aeb-4652-b1fc-d679d9e4d0d8');
d.settings({ignoreUndefinedProperties:true});
(async()=>{
  const j=await d.collectionGroup('listings').where('type','==','job').where('status','in',['active','approved']).orderBy('createdAt','desc').limit(5).get();
  const safe=(s,f)=>{const r={};f.forEach(x=>{const v=s.data()[x];if(v!==undefined&&v!==null&&(!x.startsWith('_'))&&(typeof v!=='object'||Array.isArray(v)))r[x]=v;const c=s.data().createdAt;if(c?.toDate)r.createdAt=c.toDate().toISOString()});return r};
  const jobs=j.docs.map(d=>safe(d,['title','isPremium','isUrgent','location','comp','company','companyName','salary','plataMin','plataMax','salaryType','benefits','logo']));
  await d.doc('metadata/homepage_fastpath').delete();
  await d.doc('metadata/homepage_fastpath').set({homepage:{success:true,stats:{totalJobs:111,totalMachines:1},premiumJobs:[],urgentJobs:[],latestJobs:jobs,latestMachines:[],latestRealEstate:[],latestAccommodations:[],latestCaterings:[],latestArticles:[]},updatedAt:a.firestore.FieldValue.serverTimestamp()});
  console.log('Fast-Path napisan:',jobs.length,'poslova');
})();
"
```

### 🚀 Prvi start (hladni start)

1. `npm run dev`
2. Sačekaj **~15-20 sekundi** da se Firestore upiti izvrše
3. **Ctrl+Shift+R** (hard refresh) u browseru
4. Homepage prikazuje 5 najnovijih poslova
5. `/poslovi` strana prikazuje sve poslove (posle ~5-10s učitavanja)
6. Sledeći putevi su brži jer Fast-Path radi

### ⚠️ Ne diraj u BFF tokom rada servera

Background task prepisuje Fast-Path posle svakog zahteva. Ako ti treba da ručno upišeš Fast-Path:
1. Sačekaj da se server pokrene i background task završi (prvi zahtev)
2. Tek onda piši Fast-Path skriptom gore
3. Inače će background task odmah prepisati tvoje podatke sa praznima

### 🗑️ Mrtvi fajlovi (obrisani u ovoj sesiji)

**Frontend (11 fajlova):**
`src/components/seo/EntityContextLinker.tsx`, `src/components/ui/CopyLinkButton.tsx`,
`src/hooks/useDataFetching.ts`, `src/hooks/useFirestoreListener.ts`, `src/hooks/usePaginatedList.ts`, `src/hooks/useVisibilityAwareSubscription.ts`,
`src/lib/monitoredFirestore.ts`, `src/lib/searchUtils.ts`, `src/lib/securityObserver.ts`, `src/lib/firestoreUtils.ts`
`src/lib/performance.ts` → **sveden na stub** (24 linije, passthrough funkcije)

**Server (4 fajla):**
`server/services/internal-linking.service.ts`, `server/services/matrix-router.service.ts`,
`server/subscribers/cache.subscriber.ts`, `server/subscribers/sync.subscriber.ts`

**Sentry (1 fajl):**
`server/utils/sentry-stub.ts` → zamenjen sa `@sentry/node` u `server.ts`

### 🔄 Ako se sjebe

**Simptom: Homepage 0 poslova, /api/bff/homepage timeout**
1. Proveri Fast-Path: `node -e "require('firebase-admin')..."` vidi gore
2. Ako je prazan → upiši ručno (skripta gore)
3. Proveri timeout-e u `bff.service.ts` (treba 15000ms i 25000ms)
4. Ako i dalje ne radi → `git checkout 83949ca` pa ponovo primeni fix-eve

**Simptom: Logo se ne vidi na homepage (samo slova), ali se vidi na /poslovi**
1. Fast-Path ima stare podatke bez `logo` polja (ručno upisan skriptom koji nije uključivao logo)
2. Izbriši Fast-Path: `node -e "const a=require('firebase-admin'),{getFirestore:b}=require('firebase-admin/firestore');a.initializeApp({credential:a.credential.cert(require('./firebase-service-account.json'))});b(a.app(),'ai-studio-13fdc921-7aeb-4652-b1fc-d679d9e4d0d8').doc('metadata/homepage_fastpath').delete().then(()=>console.log('OK')).catch(e=>console.error(e.message))"`
3. Posle brisanja, sledeći zahtev će ići u real-time fallback i vratiti logo
4. Background task (debounce 5min) će napisati svež Fast-Path SA logom
5. Proveri `bff.service.ts` — `readFastPathHomepage()` ima validaciju: ako `latestJobs[0].logo` ne postoji, tretira Fast-Path kao miss

**Simptom: /poslovi prazan, /api/jobs timeout**
- Firestore upit je spor (1-13s). Sačekaj duže ili proveri mrežu.
- Ako je online server brz a lokalan spor → geografija, nije bug.

### 🔐 Service Account
- Fajl: `firebase-service-account.json` (u .gitignore, ne commit-uje se)
- `.env`: `FIREBASE_SERVICE_ACCOUNT_KEY="./firebase-service-account.json"`
- Ako `.env` nema ovu liniju → dodaj je

### 🧪 Lint
```powershell
npm run lint
```
Samo 2 pre-existing greške u `src/components/AiSearchBar.tsx` — ne diraj.

## Bundle Size (Uncompressed, initial load ~1.6MB)
- `vendor-core`: 460KB (React, Router, Query)
- `vendor-firebase`: 242KB (Firebase SDK)
- `vendor-other`: 263KB (misc vendors)
- `vendor-data`: 146KB (date libs)
- `vendor-ui`: 75KB
- `vendor-firebase-auth`: 88KB
- `index`: 314KB (app code)
- `vendor-charts` (434KB) i `vendor-motion` (128KB) su lazy-loaded — ne utiču na initial load
