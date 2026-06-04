# ADR 009: Financial Ledger, Idempotency and Payment ACID Transactions

## Metrika Koja Se Optimizuje
- Sprečavanje duple naplate i narušavanja finansijskog integriteta pri mrežnim prekidima.
- Smanjenje fragmentacije transakcione logike (objedinjavanje PaymentSaga i FinancialLedgerService platforme).

## Kontekst i Trenutno Stanje (Current Code Architecture)
Trenutno, finansijski tokovi (Domain 9) koriste Stripe Webhook koji se uspešno prebacuje u transakcioni `Outbox` sistem, obezbeđujući prvu razinu zaštite. Zatim se pokreće `PaymentSaga` preko `payment.subscriber.ts`.
Međutim, arhitektura ima kritične slabosti:
1. **Razbijene Transakcije (Partial Commits)**: `PaymentSaga` sprovodi operacije u odvojenim koracima (Step 1 upisuje u Ledger, Step 2 ažurira Wallet). U slučaju pada između Step 1 i Step 2, Ledger ostaje izmenjen, a Wallet nije. 
2. **Nepropisna Idempotencija u Ledger-u**: `FinancialLedgerService.updateBalance()` generiše nasumičan `doc()` ID, a `referenceId` upisuje unutar metapodataka. Ukoliko se metod pozove više puta usled "retry" operacije, korisniku će se duplo "skinuti" (ili dodati) iznos.
3. **Dupliranje Koda**: `PaymentSaga` zaobilazi `FinancialLedgerService` i vrši direktan `.increment()` na `users.partnerBalance` umesto da se koristi `wallets` kolekciji (kreiranoj isključivo u FinancialLedgerService za izolaciju salda).

## Predloženo Bolje Rešenje (Proposed Enterprise State)
1. **Dokazivo Neprobojan Ledger**: Promeniti `FinancialLedgerService.updateBalance()` da prihvata `idempotencyKey` koji se direktno mapira na Document URL `transactions/{idempotencyKey}` i unutar Firestore ACD transakcije osigurati:
   ```typescript
   const transRef = db.collection("transactions").doc(idempotencyKey);
   const transSnap = await transaction.get(transRef);
   if (transSnap.exists) { return existingResult; } 
   ```
2. **Fuzija Transakcije (Single ACID Commit)**: Modifikovati `PaymentSaga` da delegira upis promena na računu direktno u `FinancialLedgerService`, unutar jedne objedinjene Cloud Firestore transakcije (Zero partial-commit opasnost).
3. **Fail-Gracefully Fallback**: Rad implementirati tako da svaki problem na Stripe endpoint serveru obara event u `DLQ` sa kog ga `AlertingService` podiže ka admin kanalu.
4. **Zabrana `.increment()` operacija van centralnog Ledgera**: Sva dodavanja i oduzimanja se prebacuju striktno u `/wallets/{uid}`.

## Zaključak i Procena
Ovim rešenjem izdržavamo 10.000 konkurentnih HTTP poziva sa istim ključem (npr. greške korisnikovog duplog klika ili Stripe delay retry) i obezbeđujemo da korisnikov iznos ostane absolutno bezbedan i samo jednom procesiran.
