type UnsubscribeFn = () => void;

class DashboardSubscriptionManagerClass {
  private subscriptions = new Map<string, UnsubscribeFn>();

  /**
   * Registruje aktivnu Firestore pretpatu pod jedinstvenim ključem.
   * Ako pretplata pod tim ključem već postoji, automatski je otkazuje i zamenjuje je novom.
   */
  register(key: string, unsubscribe: UnsubscribeFn): void {
    if (this.subscriptions.has(key)) {
      console.info(`[SubscriptionManager] Key "${key}" already exists. Cleaning old listener before registering new one.`);
      this.unregister(key);
    }
    this.subscriptions.set(key, unsubscribe);
    console.info(`[SubscriptionManager] Registered active listener for "${key}". Total active: ${this.subscriptions.size}`);
  }

  /**
   * Otkazuje i briše pretplatu pod datim ključem.
   */
  unregister(key: string): void {
    const unsub = this.subscriptions.get(key);
    if (unsub) {
      try {
        unsub();
        console.info(`[SubscriptionManager] Successfully unsubscribed listener: "${key}"`);
      } catch (err) {
        console.error(`[SubscriptionManager] Error unsubscribing "${key}":`, err);
      }
      this.subscriptions.delete(key);
    }
  }

  /**
   * Otkazuje bezuslovno i briše sve registrovane realtime pretplate.
   * Koristi se pri napuštanju dashboard ekrana ili pri logout-u.
   */
  cleanup(): void {
    if (this.subscriptions.size === 0) return;
    console.info(`[SubscriptionManager] Initiating cleanup of ${this.subscriptions.size} active listener(s)...`);
    
    for (const [key, unsub] of this.subscriptions.entries()) {
      try {
        unsub();
        console.info(`[SubscriptionManager] Cleanup unsubscribed: "${key}"`);
      } catch (err) {
        console.error(`[SubscriptionManager] Cleanup failed for "${key}":`, err);
      }
    }
    
    this.subscriptions.clear();
    console.info("[SubscriptionManager] All subscriptions successfully cleared.");
  }

  /**
   * Vraća broj aktivnih pretpata.
   */
  getActiveCount(): number {
    return this.subscriptions.size;
  }
}

export const DashboardSubscriptionManager = new DashboardSubscriptionManagerClass();
