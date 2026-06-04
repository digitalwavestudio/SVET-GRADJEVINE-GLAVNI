# ADR 003: "Circuit Breaker" i Adaptive QoS Zaštita (Stale-Cache Mod)

**Status:** Kreirano / Aktivno
**Domen:** Saobraćajna Zaštita i Rate Limiting
**Datum:** 2026-05-25

## 1. Kontekst i Problem
Platforme otvorenog tipa suočavaju se sa iznenadnim skokovima saobraćaja (tzv. "viral spikes", DDoS ili masovni bot activity). Naš trenutni mehanizam keširanja u `CacheService` rutinski odbacuje istekle rekorde (bazirano na Redis PX TTL tajmeru). U scenariju preoterećenja kvote na Firebase-u (`checkQuotaStatus() === true`) ili kada je baza degradirana, rutinsko brisanje isteklih rezultata izaziva Cache Miss. Gubitak keša dovodi do pokušaja masovnog Firestore Read-a, podižući error rete, generišući enormne Cloud troškove (ili odbijanje pristupa ukoliko su zaštite kvote striktno setovane). Sistem nije imao adekvatan način da "preživi" pad baze uspešnim posluživanjem starih podataka - degradirao bi previša grubo.

## 2. Cilj (Metrika Superiornosti)
Uvesti **Fail-Gracefully Povelju**: Sistem MORA preferencijalno servirati "bajate" (Stale) podatke, nego pasti isporučujući 500 greške i probijanje kvote. 
Optimizaciona metrika: Smanjenje Firestore Reads pod visokim opterećenjem na praktično nulu, preusmeravanjem saobraćaja isključivo na Redis Stale podatke, zadržavajući korisničko iskustvo.

## 3. Izabrano Enterprise Rešenje
Prilagođavanje L2 Cache servisa na **"Zadrži dugo, ažuriraj stalno" (Cache Envelope Pattern)**.

1.  **Dugovecni Redis Omotač (Envelope):** `CacheService.set` funkcija od sada upisuje podatak unutar posebnog objekta `__isEnvelope` i pridružuje mu "Logički Expiry". Redis fizički TTL (PX) koji održava dokument u memoriji se produžava na 30 dana otpornosti (Resilience window).
2.  **Adaptive QoS Citanje:** Prilikom čitanja `CacheService.get`, ukoliko primetimo da je API kvota potrošena (`checkQuotaStatus() === true`) ili je mrežni Circuit Breaker "OPEN", funkcija namerno donosi odluku da ignoriše "Logički Expiry" i isporučuje podatak iz perioda kada je bio sačuvan. 
3.  **Circuit Breaker Prevencija Tresa (Thundering Herd):** Ako iz bilo kog razloga baza ne može isporučiti uspeh, i desavanje nije eksplicitno "Cache Miss", "Stale" odgovor obustaviće dalja traženja prema Firestore-u u `getOrSet()`.

## 4. Zaključak i Posledice
- **Stabilnost:** Povećana otpornost sistema. Aplikacija se nikada neće potpunosti srušiti ili generisati ogromne troškove Firestore reads-a zbog privremenog "Cache expiration-a" tokom DDoS-a.
- **Back-Compatibility:** Svi postojeći zapisi u Redisu (bez omotača) biće adekvatno isporučeni ali se i adekvatno obrisani regularnim dosadašnjim tokom dok ih novi sistem vremenom sam ne prebriše "omotač" sistemom.
