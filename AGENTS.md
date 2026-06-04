ENTERPRISE agents.md — STABILITY & CONTROL PROTOKOL
0. 🎯 OSNOVNI PRINCIP

Sistem mora balansirati:

Stabilnost (primarno)
Održivost (kritično)
Skalabilnost (kontrolisano)
Minimalna kompleksnost (default)

👉 Cilj nije “najjednostavniji kod”, nego:

najjednostavniji kod koji može stabilno da raste

🚫 1. ANTI-OVERENGINEERING POLICY (DEFAULT MODE: SIMPLE)
1.1 KISS princip (podrazumevano)

Agent mora preferirati:

direktna rešenja
minimalan broj slojeva
postojeću arhitekturu pre novih sistema

❗ Zabranjeno je uvoditi kompleksnost bez potrebe za jednim od sledećih:

smanjenje realne kompleksnosti
poboljšanje performansi
smanjenje troškova
poboljšanje stabilnosti
1.2 Apstrakcije i slojevi

Apstrakcije su:

✅ DOZVOLJENE KADA:
se kod ponavlja na ≥ 2 mesta
postoji realan reuse benefit
smanjuju coupling između domena
povećavaju testabilnost ili izolaciju
❌ ZABRANJENE KADA:
služe samo “organizaciji”
ne uklanjaju kompleksnost
dodaju novi hop bez vrednosti

👉 Pravilo:

Svaka apstrakcija mora imati merljiv benefit.

1.3 Arhitekturni slojevi

Preferirana struktura:

UI → Service → DB/API

ili

UI → Hook → Service → DB/API

❗ Dodatni slojevi (adapter, wrapper, helper) su dozvoljeni samo ako:

rešavaju specifičan tehnički problem
smanjuju kompleksnost sistema
🧠 2. EVOLUTIVNA ARHITEKTURA (VAŽNO)

Sistem NIJE statičan.

Dozvoljeno:
postepeni refactor
uvođenje novih slojeva kada sistem raste
modularizacija kada complexity raste
Zabranjeno:
prerani enterprise design
“over-modularization”
fragmentacija bez razloga
🩹 3. SURGICAL CHANGE POLICY
3.1 Minimalne izmene

Preferira se:

Novi fajl je dozvoljen samo ako:

postojeći fajl prelazi prag održavanja
modul ima jasnu poslovnu granicu
postoji realna potreba za separation of concerns

3.3 Dependencies

Nove biblioteke su dozvoljene samo ako:

rešavaju realan problem koji bi inače zahtevao >100 linija custom koda
imaju stabilnu produkcijsku upotrebu

❌ Zabranjeno:

dodavanje helper lib-a bez jasnog benefita
⚡ 4. PERFORMANCE & RUNTIME SAFETY
4.1 Backend (Cloud Run / Node)

Zabranjeno:

infinite loops
heavy polling
CPU-bound background taskovi bez kontrole
nekontrolisani paralelizam

Dozvoljeno:

kontrolisani async flow
batch operacije
queue sistemi kada su opravdani
4.2 Frontend (React discipline)

Zabranjeno:

fetch u render flow-u
nekontrolisani useEffect dependency chain
global state propagation bez potrebe

Dozvoljeno:

TanStack Query cache-first pristup
memoization gde ima efekta
lazy loading
4.3 useEffect pravilo

Svaki useEffect mora:

imati minimal dependencies
imati cleanup ako postoji side-effect
imati jasan razlog postojanja

❗ Zabranjeno:

duplicate API calls
infinite re-render loop
🔥 5. FIRESTORE & REDIS DISCIPLINA
5.1 Firestore

Zabranjeno:

nested query waterfall
redundant reads u istom lifecycle-u
onSnapshot bez realne potrebe

Obavezno:

pagination
caching strategija
query reuse
5.2 Redis

Redis NIJE source of truth.

Dozvoljeno:

cache
rate limiting
ephemeral data

Zabranjeno:

auth state
permission logic
security decisions

Svaki cache mora imati:

TTL
fallback
failure-safe behavior
🧠 6. COMPLEXITY GOVERNANCE
6.1 Complexity kontrola

Agent mora izbegavati:

nepotrebne event chain sisteme
worker-e bez potrebe
background orchestration bez jasnog razloga
6.2 Async pravilo

Async je DOZVOLJEN i PREFERIRAN kada:

poboljšava skalabilnost
smanjuje latency
izoluje spore operacije

❌ Zabranjeno:

forsiranje sync pristupa ako sistem prirodno zahteva async
🧪 7. TIPIZACIJA & VALIDACIJA
7.1 Type safety
izbegavati any
koristiti striktne tipove gde je moguće

❗ Izuzetak:

external API bez tipova
privremeni integration sloj (mora biti označen za refactor)
7.2 Validacija

Obavezno koristiti:

Zod (ili ekvivalent)
validation na API granicama
sanitizaciju inputa
📈 8. OBSERVABILITY & COST CONTROL
8.1 Telemetrija

Dozvoljeno:

minimal logging
error tracking
performance metrics

❌ Zabranjeno:

excessive telemetry hooks
background tracing bez potrebe
8.2 Cost discipline

Agent mora voditi računa o:

Firestore read/write cost
Redis memory footprint
Cloud Run CPU usage

Svaka promena mora imati “cost awareness”.

🤝 9. KOMUNIKACIONI PROTOKOL
Komunikacija na srpskom jeziku
Bez tehničkog noise-a u output-u (build/lint/compile statusi se ne izlažu)
Fokus na poslovni i tehnički rezultat, ne internu infrastrukturu
samo kratki i direktni odgovori bez preterano objasnjenja
