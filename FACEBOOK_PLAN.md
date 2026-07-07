# Facebook Plan — Svet Građevine

Cilj: hibrid oglasnika i društvene mreže za građevinsku industriju.

## Faza 1 — Feed (globalni)

Šta se prikazuje:
- "COMPANY X je postavio oglas: Naziv Oglasa"
- "COMPANY X je dobio verifikaciju ✅"
- "COMPANY X je unapredio oglas na Premium"
- "COMPANY X je promenio logo/profilnu"
- "COMPANY X ima novi oglas u mašinama"

Tehnički:
- Kolekcija `activities` sa poljima: `type`, `actorId`, `actorName`, `actorLogo`, `message`, `link`, `createdAt`
- API: `GET /api/activities?limit=20` — globalno, sortirano po `createdAt desc`
- Homepage: FeedWidget ispod hero sekcije, umesto trenutnih statičnih sekcija

## Faza 2 — Profili + Follow sistem

Svaka firma ima javni profil (već postoji `/profil/:id`).
Dodaje se:
- **Zaprati / Pratiš** dugme na profilu firme
- Kolekcija `users/{uid}/following` i `users/{firmaId}/followers`
- Broj pratilaca na profilu

## Faza 3 — Personalizovani feed

Feed = globalne aktivnosti + aktivnosti od firmi koje pratite.
Query: `activities.where("actorId", "in", followedIds).orderBy("createdAt", "desc").limit(20)`

## Faza 4 — Inbox (FB stil)

Trenutni inbox je funkcionalan ali izgleda suvo.
FB inbox ima:
- **Levo:** lista konverzacija (avatar, ime, poslednja poruka, vreme)
- **Desno:** otvorena konverzacija (bubble poruke, plavi/ sivi)
- **Pretraga** konverzacija
- **Status** (online/offline — nije bitno za sada)

Šta treba:
- Unaprediti `MessagesPage.tsx` da ima podeljen layout (lista + chat)
- Poruke u balonima (desno = moje, levo = njihove)
- Vreme prikazano relativno (pre 5min, juče...)

## Faza 5 — Notifikacije (FB stil)

Već ima zvonce na mobilnom headeru i `/moj-profil/obavestenja`.
Treba:
- **Crvena tačica (badge)** na zvoncetu kad ima nepročitanih
- **Real-time** preko Firestore listener-a (onSnapshot)
- Notification dropdown (FB stil) — vidi 5 poslednjih bez otvaranja stranice

## Faza 6 — Komentari na oglase (opciono)

FB komentari ispod postova → komentari ispod oglasa.
- Subcollection `listings/{id}/comments`
- Samo registrovani korisnici
- Vlasnik oglasa dobija notifikaciju

## Šta NE radimo (za sada)

- Stories / Reels
- Events
- Groups
- Marketplace posebno (oglasnik je marketplace)
- Live streaming

## Redosled

1. Feed (globalni) + FeedWidget na homepage
2. Follow sistem + Zaprati dugme
3. Personalizovani feed
4. Inbox unapređenje (FB layout)
5. Notifikacije sa badge i real-time
6. Komentari (ako treba)

## Prioritet

Feed (Faza 1) je prvi. Sve ostalo posle.
