# Agents Protocol

Sva prethodna pravila su uklonjena na zahtev korisnika.

## Firestore Indexes

After modifying `firestore.indexes.json`, deploy with:
  firebase deploy --only firestore:indexes

New composite indexes added for geo P-SEO queries:
- listings CG: type + createdAt DESC, type + locationSlug + createdAt DESC, type + professionSlug + createdAt DESC, type + professionSlug + locationSlug + createdAt DESC
- users COLLECTION: locationSlug + createdAt DESC, professionSlug + createdAt DESC, professionSlug + locationSlug + createdAt DESC

Without these indexes, geo listing queries will fail at runtime with "index required" error.
