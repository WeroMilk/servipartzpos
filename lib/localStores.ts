import type { Store } from "./types";

const LOCAL_STORES_KEY = "servipartz-local-stores";

function loadStores(): Store[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<{ id: string; name: string; address?: string; createdAt: string }>;
    return parsed.map((s) => ({
      ...s,
      createdAt: new Date(s.createdAt),
    }));
  } catch {
    return [];
  }
}

function saveStores(stores: Store[]): void {
  try {
    localStorage.setItem(LOCAL_STORES_KEY, JSON.stringify(stores));
  } catch {
    // ignore
  }
}

function generateId(): string {
  return "local-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9);
}

export const localStores = {
  getAll(): Store[] {
    return loadStores();
  },

  create(name: string, address?: string): Store {
    const stores = loadStores();
    const store: Store = {
      id: generateId(),
      name: name.trim(),
      address: address?.trim() || undefined,
      createdAt: new Date(),
    };
    stores.push(store);
    saveStores(stores);
    return store;
  },

  update(storeId: string, data: { name?: string; address?: string }): void {
    const stores = loadStores();
    const idx = stores.findIndex((s) => s.id === storeId);
    if (idx === -1) return;
    if (data.name !== undefined) stores[idx].name = data.name.trim();
    if (data.address !== undefined) stores[idx].address = data.address?.trim() || undefined;
    saveStores(stores);
  },

  delete(storeId: string): void {
    const stores = loadStores().filter((s) => s.id !== storeId);
    saveStores(stores);
  },

  /** Inicializa con tienda por defecto si no hay ninguna */
  ensureDefault(defaultName: string): Store[] {
    let stores = loadStores();
    if (stores.length === 0) {
      const defaultStore: Store = {
        id: "default",
        name: defaultName,
        createdAt: new Date(),
      };
      stores = [defaultStore];
      saveStores(stores);
    }
    return stores;
  },
};
