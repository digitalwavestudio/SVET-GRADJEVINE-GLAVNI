import { AsyncLocalStorage } from "async_hooks";
import { v4 as uuidv4 } from "uuid";
import { env } from "../config/env.ts";

export class TraceContext {
  private static storage = new AsyncLocalStorage<Map<string, string>>();
  private static region = env.APP_REGION;

  /**
   * Pokreće novi kontekst sa TraceID-jem.
   */
  static run<T>(traceId: string | undefined, fn: () => T): T {
    const context = new Map<string, string>();
    context.set("traceId", traceId || uuidv4());
    return this.storage.run(context, fn);
  }

  /**
   * Get value from context storage.
   */
  static get(key: string): string | undefined {
    const context = this.storage.getStore();
    return context?.get(key);
  }

  /**
   * Set value in context storage.
   */
  static set(key: string, value: string): void {
    const context = this.storage.getStore();
    if (context) {
      context.set(key, value);
    }
  }

  /**
   * Generiše novi TraceID bez pokretanja konteksta.
   */
  static generateId(): string {
    return uuidv4();
  }

  /**
   * Vraća trenutni TraceID.
   */
  static getTraceId(): string {
    const context = this.storage.getStore();
    return context?.get("traceId") || "no-trace";
  }

  /**
   * Kreira log prefix sa TraceID-jem i regionom.
   */
  static logPrefix(): string {
    return `[Region: ${this.region}] [TraceID: ${this.getTraceId()}]`;
  }
}
