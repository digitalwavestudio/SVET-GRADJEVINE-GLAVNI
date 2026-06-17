export enum CircuitState {
  CLOSED,
  OPEN,
  HALF_OPEN,
}

export class CircuitBreaker {
  private static registry = new Map<string, CircuitBreaker>();
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private lastErrorTime: number = 0;
  private readonly threshold: number = 5;
  private readonly timeout: number = 30000; // 30 sekundi

  constructor(private name: string) {
    CircuitBreaker.registry.set(name, this);
  }

  static getRegistryStats() {
    return Array.from(this.registry.values()).map((cb) => cb.getStats());
  }

  async execute<T>(action: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastErrorTime > this.timeout) {
        console.info(`[CircuitBreaker] ${this.name} half-opening...`);
        this.state = CircuitState.HALF_OPEN;
      } else {
        throw new Error(`Circuit Breaker ${this.name} is OPEN`);
      }
    }

    try {
      const result = await action();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = CircuitState.CLOSED;
  }

  private onFailure() {
    this.failureCount++;
    this.lastErrorTime = Date.now();
    if (this.failureCount >= this.threshold) {
      console.error(`[CircuitBreaker] ${this.name} is now OPEN`);
      this.state = CircuitState.OPEN;
    }
  }

  getStats() {
    return {
      name: this.name,
      state: CircuitState[this.state],
      failureCount: this.failureCount,
      lastErrorAt:
        this.lastErrorTime > 0
          ? new Date(this.lastErrorTime).toISOString()
          : null,
    };
  }

  reset() {
    this.failureCount = 0;
    this.state = CircuitState.CLOSED;
    this.lastErrorTime = 0;
  }

  static resetAll() {
    for (const cb of this.registry.values()) {
      cb.reset();
    }
  }

  static resetByName(name: string) {
    const cb = this.registry.get(name);
    if (cb) {
      cb.reset();
      return true;
    }
    return false;
  }
}

export const syncCircuit = new CircuitBreaker("AlgoliaSync");
