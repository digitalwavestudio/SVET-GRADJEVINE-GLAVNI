class MemoryStorage implements Storage {
  private data: Record<string, string> = {};

  get length(): number {
    return Object.keys(this.data).length;
  }

  clear(): void {
    this.data = {};
  }

  getItem(key: string): string | null {
    return this.data[key] !== undefined ? this.data[key] : null;
  }

  key(index: number): string | null {
    const keys = Object.keys(this.data);
    return keys[index] !== undefined ? keys[index] : null;
  }

  removeItem(key: string): void {
    delete this.data[key];
  }

  setItem(key: string, value: string): void {
    this.data[key] = String(value);
  }
}

const getStorage = (type: 'localStorage' | 'sessionStorage'): Storage => {
  if (typeof window === 'undefined') {
    return new MemoryStorage();
  }
  try {
    const storage = window[type];
    if (!storage) {
      return new MemoryStorage();
    }
    // Provera permisija i bezbednosti (pogotovu u iframe okruženju)
    const testKey = '__storage_test__';
    storage.setItem(testKey, '1');
    storage.removeItem(testKey);
    return storage;
  } catch (e) {
    console.warn(`[SafeStorage] ${type} is blocked (e.g. i-frame security policy). Falling back to in-memory mock store.`, e);
    return new MemoryStorage();
  }
};

export const safeLocalStorage = getStorage('localStorage');
export const safeSessionStorage = getStorage('sessionStorage');
