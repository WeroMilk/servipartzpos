/**
 * Fecha/hora del último inventario completado (todas las botellas revisadas con ✓/✗).
 * Se muestra debajo de las categorías en móvil y en el centro del footer en desktop.
 */
const KEY = "mibarra-last-inventory-complete";
const EVENT = "mibarra-last-inventory-complete-changed";

function format(date: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function getLastInventoryComplete(): string {
  if (typeof window === "undefined") return "—";
  const raw = localStorage.getItem(KEY);
  if (!raw) return "—";
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? "—" : format(d);
}

export function setLastInventoryComplete(): void {
  if (typeof window === "undefined") return;
  const now = new Date();
  localStorage.setItem(KEY, now.toISOString());
  window.dispatchEvent(new CustomEvent(EVENT, { detail: format(now) }));
}

export const LAST_INVENTORY_COMPLETE_EVENT = EVENT;
