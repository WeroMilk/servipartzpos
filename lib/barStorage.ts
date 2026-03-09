import { Bottle } from "./types";
import { defaultBottles } from "./bottlesData";

/** Clave de localStorage donde se guarda el inventario de la tienda (Servipartz POS). */
export const BAR_BOTTLES_KEY = "servipartz-pos-inventory";

/**
 * Carga las botellas del bar desde localStorage.
 * Si no hay nada guardado, inicializa con el catálogo completo (50 productos demo) y lo guarda.
 */
export function loadBarBottles(): Bottle[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(BAR_BOTTLES_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Bottle[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Migración: añadir price si falta (bottles guardados antes de tener precios)
        const withPrices = parsed.map((b) => {
          if (b.price != null && b.price > 0) return b;
          const def = defaultBottles.find((d) => d.id === b.id);
          return { ...b, price: def?.price ?? 0 };
        });
        return withPrices;
      }
    }
    // Primera vez: cargar inventario demo con todos los productos
    saveBarBottles(defaultBottles);
    return defaultBottles;
  } catch {
    // Ignorar datos corruptos en localStorage
  }
  return [];
}

/**
 * Guarda las botellas del bar (las que el usuario eligió en Mi Inventario).
 */
export function saveBarBottles(bottles: Bottle[]): void {
  try {
    localStorage.setItem(BAR_BOTTLES_KEY, JSON.stringify(bottles));
  } catch {
    // Ignorar fallo de escritura en localStorage
  }
}

/**
 * Devuelve los IDs de las botellas actualmente guardadas como inventario del bar.
 * Útil para pre-seleccionar en la pantalla "Modifica tu inventario".
 */
export function getBarBottleIds(): Set<string> {
  const bottles = loadBarBottles();
  return new Set(bottles.map((b) => b.id));
}
