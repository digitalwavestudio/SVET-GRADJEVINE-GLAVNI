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

78 indexes defined in `firestore.indexes.json`. 55 deployed to `ai-studio` (via gcloud --async). Remaining 23 (premium/urgent variants) need `gcloud` deployment.

Indexes created in this session (12 new on ai-studio): type+status+categorySlug+createdAt, type+status+categoryId+createdAt, type+status+typeSlug+createdAt, type+status+mainCategories+CONTAINS+createdAt, status+updatedAt, type+status+authorId, and cat+city combo variants (categorySlug+locationSlug, categoryId+locationSlug, typeSlug+locationSlug).

To deploy remaining indexes from `firestore.indexes.json` to ai-studio:
```powershell
$json = Get-Content -Raw "firestore.indexes.json" | ConvertFrom-Json
foreach ($idx in $json.indexes) {
  $args = @(); $args += "--collection-group=$($idx.collectionGroup)"; $args += "--query-scope=$($idx.queryScope)"
  foreach ($f in $idx.fields) {
    if ($f.order) { $args += "--field-config", "field-path=$($f.fieldPath),order=$($f.order)"
    } else { $args += "--field-config", "field-path=$($f.fieldPath),array-config=$($f.arrayConfig)" }
  }
  $args += "--database=ai-studio-13fdc921-7aeb-4652-b1fc-d679d9e4d0d8"; $args += "--project=gen-lang-client-0548525213"; $args += "--async"
  & "gcloud" "firestore" "indexes" "composite" "create" @args 2>&1
}
```

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

## Bundle Size (Uncompressed, initial load ~1.6MB)
- `vendor-core`: 460KB (React, Router, Query)
- `vendor-firebase`: 242KB (Firebase SDK)
- `vendor-other`: 263KB (misc vendors)
- `vendor-data`: 146KB (date libs)
- `vendor-ui`: 75KB
- `vendor-firebase-auth`: 88KB
- `index`: 314KB (app code)
- `vendor-charts` (434KB) i `vendor-motion` (128KB) su lazy-loaded — ne utiču na initial load
