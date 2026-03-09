import type { Store } from "./types";

const LOCAL_STORES_KEY = "servipartz-local-stores";

function loadStores(): Store[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<{ id: string; name: string; address?: string; createdAt: string }>;
    const stores = parsed.map((s) => ({
      ...s,
      name: s.name === "Tienda principal" ? "Matriz" : s.name,
      createdAt: new Date(s.createdAt),
    }));
    // Migrar "Tienda principal" a "Matriz" y guardar
    const changed = stores.some((s, i) => s.name !== parsed[i]?.name);
    if (changed) {
      try {
        localStorage.setItem(LOCAL_STORES_KEY, JSON.stringify(stores));
      } catch {
        /* ignore */
      }
    }
    return stores;
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

  /** Actualiza si existe, o añade la tienda si no está en local (fallback desde Firebase) */
  upsert(storeId: string, name: string, address?: string): void {
    const stores = loadStores();
    const idx = stores.findIndex((s) => s.id === storeId);
    if (idx >= 0) {
      stores[idx].name = name.trim();
      stores[idx].address = address?.trim() || undefined;
    } else {
      stores.push({
        id: storeId,
        name: name.trim(),
        address: address?.trim() || undefined,
        createdAt: new Date(),
      });
    }
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
