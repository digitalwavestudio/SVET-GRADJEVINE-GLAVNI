# ADR 010: Ne-blokirajuće pokretanje migracija na startu servera (Non-Blocking Startup Migrations)

**Status:** Kreirano / Aktivno
**Domen:** Deployment i Infrastrukturna Stabilnost
**Datum:** 2026-05-25

## 1. Kontekst i Problem
Prilikom pokretanja servera u produkcionom okruženju (Cloud Run u AI Studio sandboksu), kontejner mora otvoriti port `3000` i odgovoriti na TCP zdravstvenu provere (Startup TCP probe) u roku od 10 uzastopnih pokušaja. 
U dosadašnjoj arhitekturi, server je u okviru `startServer()` funkcije blokirao pokretanje HTTP listenera (`app.listen`) čekajući završavanje svih baza podataka i migracija:
```ts
if (RegionService.isLeaderRegion() || process.env.NODE_ENV !== "production") {
  ...
  await runPendingMigrations();
}
```
Ovakav dizajn predstavlja visoki rizik od **hladnog starta baze (Cold Start)** ili mrežnog zagušenja. Kada je `firebase-applet-config.json` odsutan ili kada Firestore Admin SDK pokušava da otkrije metapodatke projekta i verifikuje credencijale preko Google Metadata servera, sinhroni poziv `await runPendingMigrations()` blokira ceo Node.js event loop i odlaže otvaranje porta `3000`. Kao posledica, Cloud Run Startup Probe tajmautuje sa greškom `DEADLINE_EXCEEDED` i gasi kontejner pre nego što express aplikacija uopšte dobije priliku da uspostavi mrežni socket.

## 2. Cilj (Metrika Superiornosti)
Uvesti dugoročnu stabilnost i **Zero-Blocking Boot** šemu.
- **Optimizaciona metrika:** Smanjenje vremena do otvaranja porta `3000` (time-to-listen) na **<100ms** od izvršne instrukcije (skoro trenutno), bez obzira na mrežni status Firestore-a ili Redis-a.
- Osigurati da se zdravstvene provere (`/api/system/liveness`) mogu momentalno procesuirati i time zaštiti novčanik i resurse od roll-back havarija.

## 3. Izabrano Enterprise Rešenje
Asinhrona izolacija mrežnih migracija iz kritične inicijalizacione putanje servera:

1. **Background Async Execution:** Promeniti sinhroni `await runPendingMigrations()` poziv za produkcioni tok u asinhroni (fire-and-forget) proces sa ugrađenim `.catch` handlerom koji osigurava da se eventualne greške baze loguju, ali ne ruše proces niti odlažu start listenera.
2. **Immediate Socket Binding:** Pomoriti Express `app.listen()` na najviši mogući prioritet tokom startup faze.
3. **Resilient Failure Logging:** Ugrađivanjem robusnog error logging sloja preko `LoggerService.error` unutar catch bloka osiguravamo potpunu vidljivost izvršenja u logovima bez ugrožavanja liveness i readiness provera.

## 4. Zaključak i Posledice
- **Pouzdane isporuke (Zero-Impact Deployments):** Kontejner se uspešno podiže i prolazi sve Cloud Run probe nezavisno od toga da li je Firestore dostupan u prvoj sekundi starta.
- **Otpornost baze:** Sve migracije se pokreću u pozadini i izvršavaju bezbedno onog momenta kada resursi i konekcioni pulovi postanu spremni u asinhronom event loop toku.
