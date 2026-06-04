import { getRedis } from "../utils/redis.ts";

interface IdempotencyRecord<T = unknown> {
  status: "processing" | "completed";
  response?: {
    statusCode: number;
    body: T;
  };
}

export class IdempotencyService {
  private static redis = getRedis();
  private static TTL = 86400; // 24 sata za eksplicitne ključeve
  private static DEBOUNCE_TTL = 5; // 5 sekundi za dinamičke debounce ključeve

  /**
   * Pokušava da rezerviše ključ.
   * Vraća record ako ključ već postoji, ili null ako je slobodan.
   */
  static async start<T = unknown>(key: string): Promise<IdempotencyRecord<T> | null> {
    if (!this.redis) return null;

    const fullKey = `idempotency:${key}`;
    const existing = await this.redis.get(fullKey);

    if (existing) {
      return JSON.parse(existing) as IdempotencyRecord<T>;
    }

    // Rezervišemo ključ kao 'processing' (Atomic NX)
    const reserveTtl = key.startsWith("debounce:") ? this.DEBOUNCE_TTL : 60;
    const success = await this.redis.set(
      fullKey,
      JSON.stringify({ status: "processing" }),
      "EX",
      reserveTtl,
      "NX",
    );

    return success ? null : { status: "processing" };
  }

  /**
   * Snima finalni rezultat operacije.
   */
  static async finish<T = unknown>(key: string, statusCode: number, body: T) {
    if (!this.redis) return;

    const fullKey = `idempotency:${key}`;
    const record: IdempotencyRecord<T> = {
      status: "completed",
      response: { statusCode, body },
    };

    const ttl = key.startsWith("debounce:") ? this.DEBOUNCE_TTL : this.TTL;
    await this.redis.set(fullKey, JSON.stringify(record), "EX", ttl);
  }

  /**
   * Oslobađa ključ u slučaju greške pre završetka.
   */
  static async cleanup(key: string) {
    if (this.redis) {
      await this.redis.del(`idempotency:${key}`);
    }
  }
}
