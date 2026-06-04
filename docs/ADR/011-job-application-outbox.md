# ADR 011: Job Application Enterprise Outbox Pattern

## Status
Prihvaćeno

## Kontekst
Povećan sabraćaj je izazvao preopterećenje Firestore kvota, a direktno klijentsko upisivanje aplikacija narušava Data Layer security "Zero-Impact Default" princip. Uz to, kritični događaji, kao što je obaveštenje mejlom prilikom prijave za posao, mogu da padnu ukoliko se pokušaju obaviti sve funkcije redosledno ("inline") u jednom API pozivu, uzrokujući blokadu sistema ukoliko SMTP ili EmailJS servis zastane.

## Analiza trenutnog stanja
Naš postojeći `ApplicationsService` koristi `db.runTransaction` za pisanje u `applications` kolekciju, ali da bismo ispratili najviše standarde striktnih domena za oglase za posao (i eksplicitni requirement klijenata o odvajanju resursa), kreiramo i optimizujemo rešenje preko specijalizovanog entiteta i optimizovanog `batch()` upisa.

## Odluka
1. **API Kontrakt**: Svi upisi aplikacija za posao moraju ići isključivo preko izolovane Express rute (`/api/jobs/apply`) obezbeđene Zod validacijom i rate/Idempotency limitima.
2. **Db.Batch Optimizacija**: Kreiran je novi dedikovani `JobApplicationService` u backendu koji koristi `Firebase Admin SDK db.batch()` umesto teških transakcionih setova na kolekciji nazvanoj `job_applications`. Ovim svodimo cost isključivo na `writes` (bez lockova). 
3. **Outbox Event**: Tokom iste `batch` operacije, dogadjaj `JOB_APPLICATION_RECEIVED` se upisuje u `outbox`.
4. **Queue Worker / Asinhrono Slanje**: `OutboxWorker` obrađuje zapis i prosleđuje ga `emailService.ts` koji asinhrono vrši obaveštavanje koristeći SMTP definisan u `.env`.
5. **Frontend Tanka Implementacija**: Frontend `JobDetailsPage` više nema Firebase SDK `getDoc` ili `addDoc` vezano za prijave, već okida HTTP/TanStack Query za optimizovan state management sa backendom.

## Posledice (Enterprise Impact)
*   **Optimizacija Firestore Kvota**: Više nema Firestore pisanja sa klijenta, čime čuvamo sigurnost preko Blueprint / Security pravila na Zero-trust nivo.
*   **Povećana Stabilnost**: Slanje e-mailova kroz BullMQ/Outbox eliminiše usko grlo i garantuje isporuku notifikacije i kad SMTP izbacuje Timeout errore.
*   **Brzina**: Batch writes umesto full transactions štedi lock overhead na velikim listama.
