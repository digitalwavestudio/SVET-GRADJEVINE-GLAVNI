# Enterprise Security & Auth Audit

## Trenutno Stanje i Fix (Fallback Validator)
**Datum:** maj 2026.
**Problem:** Zod Auto Validate Middleware (`autoValidateMiddleware`) se na rutama bez definisane schema šeme oslanjao na propustljiv fallback (`z.record(z.string(), z.unknown())`). Iako je štitio od *Prototype Pollution*, propuštao je nevalidne body podatke preko kojih se ugrožavala doslednost BFF arhitekture ukoliko se zaboravi lokalni validator.
**Rešenje:** 
1. Primenjen je **Zero-Trust (Strict Reject)** princip u `/server/middleware/validate.ts`.
2. Sistemska `!schema` grana sada detektuje da li postoji payload (`Object.keys(req.body).length > 0`). Ako postoji payload, a nije definisan "exempt" prefix (lokalni `validateRequest`), sistem momentalno odbija transakciju i vraća **403 Forbidden**. 
3. Sve blokade generišu log u DLQ (Dead Letter Queue) kako bi inženjeri mogli brzo identifikovati rute koje zahtevaju Zod definiciju.
4. "Exempt" lista osigurava da legacy rutiranja (`/api/jobs/`, `/api/users/`, `/api/media/` itd.) koji nativno koriste lokalne Express middleware validatore (`validateRequest(...)`), nastave sa stabilnim radom.

## Praćenje Budućih Optimizacija (Roadmap)
- [x] Obezbeđivanje API Fallback Validatora (Zero Trust).
- [ ] Implementacija centralizovane autentifikacije bez duplih Firebase middleware check-ova na serveru.
- [ ] Detekcija curenja kvota unutar auth scope-a i integracija sa `CircuitBreaker`.
- [ ] Zahtevanje striktne validacije claims-ova pre dozvoljavanja kritičnih operacija (brisanje dokumenata, migracija balansa).

> Sve arhitektonske odluke u vezi sa rutiranjem zahtevaju kreiranje novog ADR zapisa u `/docs/ADR/` pre implementacije koda.
