/**
 * Fecha/hora de la última vez que se importó un archivo de ventas
 * (el que descuenta productos del inventario). Se muestra en el footer.
 */
const LAST_SALE_IMPORT_KEY = "mibarra-last-sale-import";
const EVENT_NAME = "mibarra-last-sale-import-changed";

function formatNow(): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date());
}

export function getLastSaleImport(): string {
  if (typeof window === "undefined") return "—";
  return localStorage.getItem(LAST_SALE_IMPORT_KEY) || "—";
}

export function setLastSaleImport(): void {
  const value = formatNow();
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_SALE_IMPORT_KEY, value);
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: value }));
}

export const LAST_SALE_IMPORT_EVENT = EVENT_NAME;
