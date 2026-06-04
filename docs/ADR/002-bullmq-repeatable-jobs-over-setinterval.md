# Architecture Decision Record: 002 - Migracija Timer-driven Scavengera u BullMQ Repeatable Jobs

## 1. Kontekst i Zatečeno Stanje
Prilikom Deep Static Code provere domena infrastrukture (Infrastruktura & Queues), detektovano je više kršenja pravila o tehnološkom plafonu pod "Zabranom naivnih `setInterval` polling petlji". 

Ključni enterprise moduli aplikacije koriste JavaScript native funkciju `setInterval` za "background-scheduling" i "scavenging":
*   `server/services/dlq.worker.ts`: Održava 30-minutnu petlju za oporavak procesa iz *Dead Letter Queue*.
*   `server/services/outbox.worker.ts`: Održava 30-minutnu petlju za pretragu *outbox* dokumenata i naknadno rehidriranje redova čekanja.
*   Još nekolicina sporednih domena (metrics, views) bazira flush mehanizme delimično na internim memorijskim tajmerima.

**Metrika identifikovanih ograničenja (Problemi postojećeg rešenja):**
1.  **Riskantna Skalabilnost (Horizontalna replikacija)**: Cloud Run okruženje pri viralnom / visokom (DDoS) saobraćaju podiže 10+ instanci. Konkurentni (simultani) pokušaji pristupa od strane Node.js tajmera iziskuju ekstremno rigorozne Redis/Firestore Lockove koji uvode trke u kodu, opterećuju operacije baze i prouzrokuju takozvane "Lock Contention" greške (vidljivo u logovima `outbox.worker.ts`).
2.  **Gubitak Vremena na Event Loop-u (CPU Overhead)**: Mnogobrojni tajmeri aktiviraju buđenje node procesa i pratećih closure-a čak i kad sistem nema preteći posao, narušavajući osnovni kvalitet event loop-a.
3.  **Nemogućnost Telemetrije**: Ne postoji prirodan način sagledavanja (Ops Dashboard-a) preostalog obima zakazanih poslova (sve je hardcoded state untar samog Worker procesa).

## 2. Dve Alternative
- **Alternativa A**: Ostati na `setInterval` arhitekturi, optimizovati `LockManager` eksplicitnim backoff strategijama. (Dugoročni underengineering anti-pattern - odbijeno).
- **Alternativa B**: **BullMQ Repeatable Jobs (Native Scheduler)**. Dizajnirana zamena Node.js tajmera. Uvođenje izdvojenog sistemskog reda (`SystemJobsQueue`) kojem samo jednom pri boot-u prijavljujemo "Repeatable pattern", puštajući Redis i BullMQ interni klaster da distribuira "Scavenge" posao na isključivo jednu jedinu slobodnu instancu unutar celog servera u datom vremenu.

## 3. Predloženo Bolje Rešenje (Proposed Enterprise State)
**Usvaja se Alternativa B.** Zbog činjenice da sistem mora da podnese velike operacije nad 100k+ entiteta i 10k istovremenih konekcija bez rušenja usled paralelnih Scavenge query-a.

**BullMQ Repeatable Job Metrika Superiornosti:**
*   **0 Redundantnih operacija**: Native scheduling unutar Redis-a eliminiše trke podova (Race Conditions). Isključivo jedan Bull job biva zadužen za posao (nema "Stampeding Herd" problema kod Lock-ova).
*   **Native Telemetrija & Retries**: Ukoliko Scavenger doživi grešku "Quota limit" i sam će se re-attempt-ovati kroz BullMQ fail-safe sistem uz transparentni dashboard loging.
*   **Optimizacija resursa Node-a**: Poptuno čišćenje nepotrebnih Node procesa (garbage kolekcije i event loop pingova).

## 4. Implementacioni Plan (Smernice)
1.  Injektovaćemo definisane System Job tipove (`DLQ_SCAVENGE_CRON`, `OUTBOX_SCAVENGE_CRON`) u centralizovani registar.
2.  Refaktorisaćemo sekvence u `outbox.worker.ts` i `dlq.worker.ts` da ukidaju `setInterval` i izlažu handler BullMQ procesoru unutar nove *system* grane.
3.  Za mrtvi *Dead Letter Queue* koji generiše `"failed_permanently"` i puko alarmira - uvešćemo dubinski automatski fallback / replay mehanizam i smanjiti gubljenje (loss) sinhronizacije ka Algoliji na najniži minimum.
