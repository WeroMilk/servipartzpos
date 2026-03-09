/**
 * Estado global de la tienda actual seleccionada (multi-tienda).
 */

const STORE_KEY = "pos_current_store_id";
const STORE_NAME_KEY = "pos_current_store_name";

export const storeStore = {
  getStoreId: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORE_KEY);
  },
  setStore: (storeId: string, storeName?: string): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORE_KEY, storeId);
    if (storeName) localStorage.setItem(STORE_NAME_KEY, storeName);
  },
  getStoreName: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORE_NAME_KEY);
  },
  clearStore: (): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORE_KEY);
    localStorage.removeItem(STORE_NAME_KEY);
  },
};
