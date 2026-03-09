/**
 * Fecha/hora del último inventario completado (todas las botellas revisadas con ✓/✗).
 * Indica si fue inventario general (todos los artículos) o parcial (solo un área).
 * Se muestra debajo de las categorías en móvil y en el centro del footer en desktop.
 */
const KEY = "mibarra-last-inventory-complete";
const EVENT = "mibarra-last-inventory-complete-changed";

export type InventoryCompleteType = "general" | "parcial";

export interface LastInventoryData {
  date: string;
  type: InventoryCompleteType;
  area?: string;
}

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

const DEFAULT_LAST_INVENTORY = "Se hizo inventario general - 08/03/2026, 08:05 a. m.";

function buildDisplayText(data: LastInventoryData): string {
  const dateStr = format(new Date(data.date));
  if (data.type === "general") {
    return `Se hizo inventario general - ${dateStr}`;
  }
  return `Se hizo inventario parcial "${data.area ?? "?"}" - ${dateStr}`;
}

export function getLastInventoryComplete(): string {
  if (typeof window === "undefined") return DEFAULT_LAST_INVENTORY;
  const raw = localStorage.getItem(KEY);
  if (!raw) return DEFAULT_LAST_INVENTORY;
  try {
    const parsed = JSON.parse(raw) as LastInventoryData;
    if (parsed.date && parsed.type) {
      return buildDisplayText(parsed);
    }
  } catch {
    // Formato antiguo: solo fecha ISO
  }
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) {
    return buildDisplayText({ date: raw, type: "general" });
  }
  return DEFAULT_LAST_INVENTORY;
}

/** Texto corto para notificaciones: "Se hizo inventario general" o 'Se hizo inventario parcial "Lavadoras"' */
export function getLastInventoryNotificationText(): string {
  if (typeof window === "undefined") return "Se hizo inventario general";
  const raw = localStorage.getItem(KEY);
  if (!raw) return "Se hizo inventario general";
  try {
    const parsed = JSON.parse(raw) as LastInventoryData;
    if (parsed.type === "general") return "Se hizo inventario general";
    return `Se hizo inventario parcial "${parsed.area ?? "?"}"`;
  } catch {
    return "Se hizo inventario general";
  }
}

export function setLastInventoryComplete(
  type: InventoryCompleteType = "general",
  area?: string
): void {
  if (typeof window === "undefined") return;
  const now = new Date();
  const data: LastInventoryData = {
    date: now.toISOString(),
    type,
    ...(type === "parcial" && area ? { area } : {}),
  };
  localStorage.setItem(KEY, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent(EVENT, { detail: buildDisplayText(data) }));
}

export const LAST_INVENTORY_COMPLETE_EVENT = EVENT;
