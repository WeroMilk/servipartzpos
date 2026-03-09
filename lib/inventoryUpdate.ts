/** Última actualización del archivo Excel del inventario (para mostrar en footer) */
export const LAST_INVENTORY_UPDATE_KEY = "mibarra-last-inventory-update";

const DEFAULT_UPDATE = "8/02/2026 11:45 am";

export function getLastInventoryUpdate(): string {
  if (typeof window === "undefined") return DEFAULT_UPDATE;
  return localStorage.getItem(LAST_INVENTORY_UPDATE_KEY) || DEFAULT_UPDATE;
}

export function setLastInventoryUpdate(value: string): void {
  localStorage.setItem(LAST_INVENTORY_UPDATE_KEY, value);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("mibarra-inventory-update-changed"));
  }
}
