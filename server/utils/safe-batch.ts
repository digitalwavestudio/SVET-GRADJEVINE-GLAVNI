import { db } from "../config/firebase.ts";
import type { WriteBatch } from "firebase-admin/firestore";

/**
 * Firestore batch operacije imaju hard limit od 500 operacija.
 * Ova utility funkcija automatski splituje operacije u chunk-ove
 * po `batchSize` i commituje ih sekvencijalno.
 *
 * @param operations - niz callback-ova koji dodaju operacije u batch
 * @param batchSize - max operacija per batch (default: 450, ostavlja margin)
 * @returns broj uspešno commit-ovanih operacija
 */
export async function safeBatchCommit(
  operations: Array<(batch: WriteBatch) => void>,
  batchSize: number = 450
): Promise<number> {
  if (operations.length === 0) return 0;

  let committed = 0;

  for (let i = 0; i < operations.length; i += batchSize) {
    const chunk = operations.slice(i, i + batchSize);
    const batch = db.batch();

    for (const op of chunk) {
      op(batch);
    }

    await batch.commit();
    committed += chunk.length;
  }

  return committed;
}

/**
 * Wrapper za situacije gde se batch gradi inkrementalno.
 * Prati broj operacija i automatski commituje kad se približi limitu.
 */
export class SafeBatchWriter {
  private batch: WriteBatch;
  private opCount = 0;
  private totalCommitted = 0;
  private readonly maxOps: number;

  constructor(maxOps: number = 450) {
    this.maxOps = maxOps;
    this.batch = db.batch();
  }

  /**
   * Dodaje operaciju u batch. Ako smo na limitu, automatski commituje i pravi novi batch.
   */
  async add(operation: (batch: WriteBatch) => void): Promise<void> {
    if (this.opCount >= this.maxOps) {
      await this.flush();
    }
    operation(this.batch);
    this.opCount++;
  }

  /**
   * Commituje trenutni batch i resetuje brojač.
   */
  async flush(): Promise<void> {
    if (this.opCount === 0) return;
    await this.batch.commit();
    this.totalCommitted += this.opCount;
    this.batch = db.batch();
    this.opCount = 0;
  }

  /**
   * Završava sve preostale operacije i vraća ukupan broj commit-ovanih.
   */
  async finalize(): Promise<number> {
    await this.flush();
    return this.totalCommitted;
  }

  get pendingCount(): number {
    return this.opCount;
  }

  get committedCount(): number {
    return this.totalCommitted;
  }
}
