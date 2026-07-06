# Agents Protocol

## ✅ STABLE BUILD (2026-06-30) — OVO JE GLAVNI BUILD

**Commit:** `d89d5fe` — **NE DIRAJ!** Ako se išta sjebe, vrati se na ovaj build.

**Šta radi:**
- Homepage: 5 najnovijih poslova SA logom (premium, urgent, latest)
- Homepage: logo se vidi i na premium i na najnovijim oglasima
- Fast-Path: ~15s prvi read, zatim instant; background task osvežava sa logom
- `/poslovi`: svi poslovi sa logom, premium na vrhu
- Lokalno: brzo (baza u Frankfurtu, geografija Srbija ↔ Nemačka)

**Ključni fajlovi i stanje:**
| Fajl | Ključna linija | Šta radi |
|---|---|---|
| `server/services/bff.service.ts` | 41 | Fast-Path timeout 15000ms |
| `server/services/bff.service.ts` | 51 | Logo validacija — ako nema logo, ignoriši Fast-Path |
| `server/services/bff.service.ts` | 283 | Background task debounce 5min |
| `server/services/bff.service.ts` | 615 | Background task se uvek pokreće (ne samo kad su jobovi prazni) |
| `server/services/bff.service.ts` | 310 | Sub-query timeout 25000ms |

**Ako se nešto sjebe, vrati se na:** `git checkout ec4b15e`

## 🏗️ Session 11 — Google Login, Dashboard Fix, SPA Passthrough (2026-07-06)

### Šta je urađeno

#### Google Login / Domain (LIVE)
- **Authorized domains**: U Firebase Console → Authentication → Settings → Authorized domains, dodati `www.svetgradjevine.com` i `svetgradjevine.com` (ranije nije bilo, pa je Google login pucao sa `auth/unauthorized-domain`).
- **Redirekcija**: `svetgradjevine.com` → `www.svetgradjevine.com` podešena na DreamHost nivou.

#### Role fix (LIVE)
- **Problem**: User (mancoresolution@gmail.com) imao `role: "standard"` umesto `role: "poslodavac"`, pa je dashboard prikazivao `StandardDashboardUI` umesto `EmployerDashboardUI`.
- **Fix**: User je manuelno izabrao "Građevinska firma" → `Izbor uloge` → rola postavljena na `poslodavac`. Token sad sadrži: `"role": "poslodavac", "admin": true`.

#### Fixevi u kodu (čekaju deploy)

| Fajl | Promena | Razlog |
|---|---|---|
| `server/middleware/spa.middleware.ts:1380-1386` | Dodato `"/kontrolna-tabla", "/moj-profil", "/poruke", "/novcanik", "/podrska", "/politika-privatnosti"` u `spaPassthroughPrefixes` | Bez ovoga, direktan URL `/kontrolna-tabla` vraća 404 (server ne prepoznaje dashboard rute) |
| `src/modules/dashboard/hooks/useDashboardNavigation.ts:92-98` | Uklonjen prefetch za `/construction/user-site` | Endpoint ne postoji na serveru, izazivao 404 u konzoli |
| `firestore.indexes.json` | Dodat composite index za `collectionGroup("conversations")` — `participants` (ARRAY_CONTAINS) + `lastMessageAt` (DESC) | Inbox poruka je pucao sa 500 zbog nedostajućeg indeksa |
| `server/controllers/metrics.controller.ts` | `getUserAnalytics` vraća `[]` umesto `{stats: []}` | Uzrok `T.map is not a function` crash-a u AnalyticsDashboardUI (Array.isArray guard je već u izvornom kodu) |

#### Ostali problemi na LIVE sajtu
- **`/api/telemetry/auth` 404** — star production build, nema u izvornom kodu
- **SSE 503** — stream endpoint nije dostupan
- Oboje će biti rešeno redeploy-em

#### Dupli biznis profil
Postoje 2 profila, oba su **namerno** (nisu bag):
1. `/moj-profil` (SettingsPage) — čuva u `users/{uid}.businessProfile` (brzi profil, ime firme, PIB, logo)
2. `/moj-profil/firma` (MyCompanyPage) — čuva kao `listings/{id}` (detaljni javni profil sa portfolio slikama)

### Šta treba deploy-ovati

```powershell
# 1. Build
npm run build

# 2. Deploy na Cloud Run
gcloud run deploy svet-gra-evine --source .

# 3. Firestore indeksi
firebase deploy --only firestore:indexes
```

## 🖼️ Session 7 — Business Logo/Cover Image Fix (2026-07-03)

**Problem:** 
1. Navbar show "UP" instead of user's business logo
2. Cover image not showing on company detail page
3. Logo/cover not synced from profile to listing documents

### Root Causes & Fixes

| Problem | Root Cause | Fix | Fajl |
|---|---|---|---|
| "UP" umesto logoa | Firestore `batch.set` sa `merge: true` **ne spaja duboko** — `businessProfile` map se zamenjuje celi, ne merge-uju se polja | Zamenjeno sa `batch.update` i dot notacijom (`"businessProfile.logo": url`) | `server/services/users.service.ts:317-332` |
| Cover image se ne vidi | `normalizeCompany` čita `c.coverImage` i `c.logo` sa top-levela, ali podaci su u `c.businessProfile.*` | Dodati fallbackovi na `businessProfile?.logo`, `businessProfile?.coverImage`, itd. | `src/modules/companies/services/companiesService.ts:24-32` |
| Promena na profilu ne ažurira listing | Niko ne sluša `FAN_OUT_PROFILE_UPDATE` outbox event | Direktan batch update listinga u `updateProfile` — upiše logo/coverImage na sve `listings` gde je `authorId == uid` | `server/services/users.service.ts` |
| `coverImage` ne postoji u BusinessProfile tipu | Tip nije imao `coverImage` i `phone` polja | Dodato u `BusinessProfile` interface | `packages/shared/src/types/user.ts:62-63` |
| `"cover"` nije validan CompressionMode | `uploadImage(file, path, "cover")` — `"cover"` ne postoji u tipu | Zamenjeno sa `"avatar"` | `DashboardHeader.tsx:102`, `SettingsPage.tsx:109` |

### Ključna lekcija
**Firestore `set` + `{ merge: true }` radi samo top-level merge.** Za ugnježđene map-e (npr. `businessProfile.logo`), polja se zamenjuju. Moraš koristiti `update` sa `"businessProfile.logo"` dot path-om da sačuvaš ostala polja.

## 🧹 Session 8 — TS Error Cleanup (2026-07-03)

Sve TS greške su rešene nakon cleanupa iz Sessions 5-6 (kad su obrisani `admin.service.ts`, `offlineSyncManager`, `trackEvent` stub-ovi, itd.).

**Ukupno rešeno:** 39 TS grešaka u 14 fajlova.

| Fajl | Greška | Fix |
|---|---|---|
| `server/services/dashboard/dashboard.service.ts` | `AdminService` import | Delegirano na `DashboardAdminService`/`DashboardEmployerService`/`DashboardSmartMatchService` |
| `server/controllers/housekeeping.controller.ts` | `archiveDeletedAds()` ne postoji | Dodata metoda u `HousekeepingService` — briše listinge `status == "deleted"` starije od 30 dana |
| `src/components/RootLayout.tsx` | `initGA(gaId)`, `trackPageView(path)` — 0 argumenata | Uklonjeni argumenti |
| `src/modules/checkout/services/walletService.ts` | `withRetry(fn, { actionName })` — 2 args umesto 1 | Uklonjen drugi argument |
| `src/modules/core/pages/ContactPage.tsx` | `trackEvent(3 args)` | Uklonjeni argumenti |
| `src/modules/jobs/components/jobs/SimilarJobsSlider.tsx` | `trackEvent(3 args)` | Uklonjeni argumenti |
| `src/modules/dashboard/hooks/useDashboardBff.ts` | `offlineSyncManager.flushOutbox/getOutbox` | Zamenjeno sa `queryClient.invalidateQueries` |
| `src/modules/dashboard/hooks/useMyAds.ts` | `offlineSyncManager.addToOutbox`, `mutationGuard(2 args)` | Uklonjen outbox blok, drugi argument iz `mutationGuard` |
| `src/modules/dashboard/pages/FavoritesPage.tsx` | `offlineSyncManager.addToOutbox` | Uklonjeni pozivi |
| `src/modules/jobs/services/jobsService.ts` | `total`, `activeJobs` ne postoje u `JobSearchApiResponse` | Uklonjena polja (API vraća samo `docs`, `totalHits`, `hasMore`) |
| `src/modules/jobs/pages/JobsPage.tsx` | `total`, `activeJobs` | Zamenjeno sa `totalHits` |
| `src/modules/dashboard/components/dashboard/FirestoreObservability.tsx` | `getSnapshot` ne postoji | Uklonjen import i pozivi |
| `src/modules/dashboard/components/dashboard/QueryOptimizationAudit.tsx` | `getSnapshot` + implicit `any` | Import uklonjen, dodati eksplicitni tipovi |
| `server/services/algolia-sync.service.test.ts` | `beforeEach` not found | Dodat u vitest import |
| `server/test-zod.ts` | `e` is unknown | Cast-an kao `{ errors: unknown }` |

## Pravila

1. **Jezik** — uvek pišem na srpskom (latinica)
2. **Objašnjenja** — normalnim jezikom, DOZVOLJEN žargon
3. **GitHub** — kad kažeš "šalji na GitHub", odmah commit i push CEO CODE na main GRANU, bez pitanja
4. **Ne šalji na cloud** — nikad ne guram BUILD na Cloud! NIKAD!

## Firestore Indexes

Deploy to default database:
  firebase use svet-gradjevine-eu
  firebase deploy --only firestore:indexes

**IMPORTANT**: App uses `(default)` database in Frankfurt (`europe-west3`). The `firebase deploy --only firestore:indexes` targets `(default)` database. 

78 indexes defined in `firestore.indexes.json`. All 78 need to be deployed to `(default)` in Frankfurt after migration.

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
- **VPC Connector**: `sg-connector-eu` (europe-west3, range 10.8.0.0/28)
- **Cloud NAT**: `svet-gradevine-nat` sa statičkom IP `35.246.202.207`
- **Cloud Router**: `svet-gradevine-router`
- **Redis host**: `spotted-loaf-funny-63490.db.redis.io:14446` — zaštićen lozinkom, firewall mora da pusti Cloud Run egress (static IP gore)
- **API Server**: `https://svet-gra-evine-xogde3x2pa-ey.a.run.app` (Frankfurt)
- **Worker**: `https://svet-gra-evine-worker-866586416544.europe-west3.run.app` (Frankfurt)

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

## 🛑 PREMIUM PONUDA HOME — NE DODAVATI `type=="job"` U `getPromotedAds`

**Razlog:** `getPromotedAds({ isPremium: true })` u `unified-ads.service.ts` i BFF fallback u `bff.service.ts` NE SMEJU da imaju `where("type", "==", "job")` filter.

Premium Ponuda na naslovnoj strani prikazuje premium oglase iz **SVIH vertikala** (poslovi, mašine, nekretnine, smeštaj, ugostiteljstvo). `type=="job"` filter bi isključio ostale kategorije.

Ako premium upit ne radi (vraća prazno), problem je **nedostajući Firestore indeks** za `(default)` bazu u Frankfurtu, a ne `type` filter. Potrebno je deploy-ovati indekse preko `firebase deploy --only firestore:indexes`.

## 🖥️ LOCALHOST SETUP (Session 5 — fixirano 2026-06-29)

**⚠️ BITNO: Lokalni dev radi brzo jer je Firestore baza sada u Frankfurtu (`europe-west3`). Više nema 1-15s kašnjenja kao ranije kad je baza bila u Oregon-u.**

### 🔧 Timeout podešavanja

| Fajl | Linija | Originalno | Fix |
|---|---|---|---|
| `server/services/bff.service.ts` | readFastPathHomepage (41) | 100ms timeout | **15000ms** — da Fast-Path read stigne |
| `server/services/bff.service.ts` | CacheService callback (310) | 10000ms sub-query | **25000ms** — da sveži upit stigne |
| `server/services/bff.service.ts` | search("jobs") limit (85, 377) | 10 | **5** — na naslovnoj 5 poslova |

### 💾 Fast-Path (homepage keš)

Fast-Path dokument je `metadata/homepage_fastpath` u `(default)` bazi. Firestore limit je **1MB** — base64 logo polja su ~800KB svako, pa se ne mogu pisati u Fast-Path.

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
const d=b(a.app());
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

### 🗑️ Mrtvi fajlovi (obrisani u OBE sesije, 5 + 6)

**Frontend (11 fajlova — Session 5):**
`src/components/seo/EntityContextLinker.tsx`, `src/components/ui/CopyLinkButton.tsx`,
`src/hooks/useDataFetching.ts`, `src/hooks/useFirestoreListener.ts`, `src/hooks/usePaginatedList.ts`, `src/hooks/useVisibilityAwareSubscription.ts`,
`src/lib/monitoredFirestore.ts`, `src/lib/searchUtils.ts`, `src/lib/securityObserver.ts`, `src/lib/firestoreUtils.ts`
`src/lib/performance.ts` → **sveden na stub** (24 linije, passthrough funkcije)

**Server — Session 5 (4 fajla):**
`server/services/internal-linking.service.ts`, `server/services/matrix-router.service.ts`,
`server/subscribers/cache.subscriber.ts`, `server/subscribers/sync.subscriber.ts`

**Server — Session 6 (1 fajl):**
`server/services/admin.service.ts` — **proxy potpuno obrisan**, sva 22 delegirana poziva zamenjena direktnim sub-service pozivima

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
2. Izbriši Fast-Path: `node -e "const a=require('firebase-admin'),{getFirestore:b}=require('firebase-admin/firestore');a.initializeApp({credential:a.credential.cert(require('./firebase-service-account.json'))});b(a.app()).doc('metadata/homepage_fastpath').delete().then(()=>console.log('OK')).catch(e=>console.error(e.message))"`
3. Posle brisanja, sledeći zahtev će ići u real-time fallback i vratiti logo
4. Background task (debounce 5min) će napisati svež Fast-Path SA logom
5. Proveri `bff.service.ts` — `readFastPathHomepage()` ima validaciju: ako `latestJobs[0].logo` ne postoji, tretira Fast-Path kao miss

**Simptom: /poslovi prazan, /api/jobs timeout**
- Firestore upit je bio spor (1-13s kad je baza bila u Oregon-u). Sada je brz u Frankfurtu.
- Ako i dalje timeoutira, proveri da li je `app.use(...)` u `server.ts` registrovao rute pravilno.

### 🔐 Service Account
- Fajl: `firebase-service-account.json` (u .gitignore, ne commit-uje se)
- `.env`: `FIREBASE_SERVICE_ACCOUNT_KEY="./firebase-service-account.json"`
- Ako `.env` nema ovu liniju → dodaj je

### 🧪 Lint
```powershell
npm run lint
```
Samo 2 pre-existing greške u `src/components/AiSearchBar.tsx` — ne diraj.

## 🏗️ Session 6 — Admin fajlovi reorganizovani + splitovani (2026-06-30)

### PROBLEM A1 — Admin servisi reorganizovani

**Šta je urađeno:**
- `admin-system.service.ts`, `admin-stats.service.ts`, `admin-moderation.service.ts` → preseljeni u `server/services/admin/`
- Ispravljeni interni importovi (relativne putanje)
- `admin.service.ts` (85L proxy, 22 delegirajuća metoda) — **obrisan**
- Svi importovi ažurirani

### PROBLEM A2 — "God controller" splitovan na 4

**Problem:** `admin.controller.ts` imao 537 linija u jednom fajlu, dok servisni sloj ispod već ima lepu podelu po domenu.

**Rešenje:** Splitovan na 4 kontrolera po domenu:

| Novi fajl | Handleri | Servisi koje poziva |
|---|---|---|
| `server/controllers/admin-users.controller.ts` | verifyUser, updateUser, syncClaims, getUsers, suspendUser, shutdownUserAccount | AdminUsersService, AdminCleanupService |
| `server/controllers/admin-ads.controller.ts` | getModerationQueue, editListing, moderateListing, getReportTranscript, resolveReport | AdminAdsService, AdminModerationService |
| `server/controllers/admin-finance.controller.ts` | getCheckouts, updateUserWallet, confirmCheckoutPayment | AdminFinanceService |
| `server/controllers/admin-settings.controller.ts` | runMigrations, reindexAll, updateSettings, getSettings, clearDashboardCache, sendBroadcast, getBroadcasts, getSupportTickets, getAbuseReports, getAuditLogs, runAuditLogsCleanup, resetCircuitBreakerOrCache, setupAlgolia | AdminSettingsService, AdminSystemService, AdminLogsService, CacheService, HousekeepingService |

**Promenjeni fajlovi:**
- `server/controllers/admin.controller.ts` — **obrisan**
- `server/controllers/admin-users.controller.ts` — **NOV** (64L)
- `server/controllers/admin-ads.controller.ts` — **NOV** (88L)
- `server/controllers/admin-finance.controller.ts` — **NOV** (46L)
- `server/controllers/admin-settings.controller.ts` — **NOV** (151L)
- `server/routes/admin.routes.ts` — importi iz 4 nova kontrolera umesto jednog

### PROBLEM A3 — AdminStatsService NE duplira postojeće servise

**Zaključak:** Nema preklapanja. Analizirana su 3 sistema:
1. **ProductAnalyticsService** — broji *interakcije* (pregledi, klikovi, upiti)
2. **SystemMetricsService** — broji *bot saobraćaj*
3. **AdminStatsService** — broji *inventar* (koliko oglasa/korisnika postoji, koliko je aktivnih/premium/urgent, procenjeni revenue)

Potpuno različiti domeni. `AdminStatsService.getGlobalStats()` čita iz `metadata/admin_stats` dokumenta koji piše `reconcileGlobalStats()` (povremeni count() upiti). `reconcileGlobalStats()` koristi Firestore `count()` agregacije koje niko drugi ne radi. **Nema refaktorisanja.**

### Ključne promene (A1 + A2)
| Fajl | Promena |
|---|---|
| `server/services/admin.service.ts` | **Obrisan** — proxy klasa sa 22 delegirajuća poziva |
| `server/services/admin-system.service.ts` | Preseljen u `admin/admin-system.service.ts` |
| `server/services/admin-stats.service.ts` | Preseljen u `admin/admin-stats.service.ts` |
| `server/services/admin-moderation.service.ts` | Preseljen u `admin/admin-moderation.service.ts` |
| `server/controllers/admin.controller.ts` | **Obrisan** — splitovan na 4 kontrolera |
| `server/controllers/admin-*.controller.ts` | **NOVI** — 4 kontrolera umesto jednog |
| `server/routes/admin.routes.ts` | Importi iz 4 nova kontrolera |
| `server/services/users.service.ts` | 2 `AdminService.syncClaims()` → `AdminUsersService.syncClaims()` |
| `server/routes/api.routes.ts` | `AdminService.getSettings()` → `AdminSettingsService.getSettings()` |
| `server/routes/messages.routes.ts` | `AdminService.getSettings()` → `AdminSettingsService.getSettings()` |

### Ne diraj
- `server/services/admin/` folder — sadrži svih 8 admin servisa
- `server/controllers/admin-*.controller.ts` — 4 kontrolera po domenu

## 💾 Session 10 — Base64 Logo → Firebase Storage Migration (2026-07-04)

**Problem:** Logo-i su bili base64 stringovi (~783KB svaki) direktno u Firestore dokumentima. Query od 20 poslova vukao 13.5MB i trajao 35s.

**Rešenje:** Migracija svih 93 base64 logoa u Firebase Storage (`svet-gradjevine-eu.firebasestorage.app`). U Firestore `logo` polju sada stoji Storage URL (ne menjan naziv polja — sve postojeće reference rade bez izmene).

**Rezultat:** 20 poslova = 41KB (sa 13.5MB). Query vreme sa 35s na ~3s.

### Kako je urađeno
| Fajl | Šta |
|---|---|
| `server/scripts/migrate-logos.ts` | **NOV** — skripta: čita base64 → dekodira → upload u Storage → update Firestore |
| `server/services/ai-search.service.ts` | Uklonjen `.select()` (nepotreban — logo je sad URL od ~100 karaktera) |
| `server/utils/firestore-utils.ts` | Timeout vraćen na 30000ms (ranije 60000ms radi testa) |

### Ako treba ponovo da se pokrene migracija
```powershell
npx tsx server/scripts/migrate-logos.ts
```
Skripta preskače dokumente koji već imaju URL logo (ne base64).

### Firebase Storage setup
- **Bucket:** `svet-gradjevine-eu.firebasestorage.app`
- **Security rules:**
  ```
  match /logos/{allPaths=**} {
    allow read: if true;
    allow write: if request.auth != null;
  }
  ```
- **Path format:** `logos/{listingId}.{ext}`
- **Public URL format:** `https://firebasestorage.googleapis.com/v0/b/svet-gradjevine-eu.firebasestorage.app/o/logos%2F{listingId}.{ext}?alt=media`

### Lekcija
Base64 u Firestore je anti-patern. Logo/coverImage moraju biti URL-ovi ka Firebase Storage, max nekoliko stotina bajtova u dokumentu. Ovo je najveća optimizacija za performanse Firestore query-ja.

