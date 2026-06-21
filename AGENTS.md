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
