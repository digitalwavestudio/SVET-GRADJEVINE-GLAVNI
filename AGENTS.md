# Agents Protocol

Sva prethodna pravila su uklonjena na zahtev korisnika.

## Firestore Indexes

Deploy to default database:
  firebase deploy --only firestore:indexes

**IMPORTANT**: App uses `ai-studio` database (not `(default)`). The `firebase deploy` only targets `(default)`. To deploy indexes to `ai-studio`, use `gcloud firestore indexes composite create` or the REST API directly.

All indexes from `firestore.indexes.json` have been deployed to the `ai-studio` database (43 indexes total, Jun 21 2026). The `(default)` database also has the same indexes deployed earlier.

## SEO / Rate Limiting

AhrefsBot moved from BAD_BOTS to whitelisted search bots (`rate-limit-shield.middleware.ts`). SPA passthrough added for `/pretraga`, `/profil/*`, `/cene-i-statistika/*` so React Router can handle them instead of returning 404.
