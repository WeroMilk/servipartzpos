/**
 * Estado global de la tienda actual seleccionada (multi-tienda).
 */

let currentStoreId: string | null = null;
let currentStoreName: string | null = null;

export const storeStore = {
  getStoreId: (): string | null => {
    return currentStoreId;
  },
  setStore: (storeId: string, storeName?: string): void => {
    currentStoreId = storeId;
    if (storeName) currentStoreName = storeName;
  },
  getStoreName: (): string | null => {
    return currentStoreName;
  },
  clearStore: (): void => {
    currentStoreId = null;
    currentStoreName = null;
  },
};
