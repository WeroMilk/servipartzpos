import { Bottle } from "./types";
import { defaultBottles } from "./bottlesData";

/** Clave de localStorage donde se guarda el inventario de la tienda (Servipartz POS). */
export const INVENTORY_KEY = "servipartz-pos-inventory";

/**
 * Carga el inventario desde localStorage.
 * Si no hay nada guardado, inicializa con el catálogo completo (50 productos demo) y lo guarda.
 */
export function loadInventory(): Bottle[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(INVENTORY_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Bottle[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Migración: añadir price si falta (productos guardados antes de tener precios)
        const withPrices = parsed.map((b) => {
          if (b.price != null && b.price > 0) return b;
          const def = defaultBottles.find((d) => d.id === b.id);
          return { ...b, price: def?.price ?? 0 };
        });
        return withPrices;
      }
    }
    // Primera vez: cargar inventario demo con todos los productos
    saveInventory(defaultBottles);
    return defaultBottles;
  } catch {
    // Ignorar datos corruptos en localStorage
  }
  return [];
}

/**
 * Guarda el inventario (los productos que el usuario eligió en Modifica tu inventario).
 */
export function saveInventory(bottles: Bottle[]): void {
  try {
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(bottles));
  } catch {
    // Ignorar fallo de escritura en localStorage
  }
}

/**
 * Devuelve los IDs de los productos actualmente guardados como inventario.
 * Útil para pre-seleccionar en la pantalla "Modifica tu inventario".
 */
export function getInventoryIds(): Set<string> {
  const bottles = loadInventory();
  return new Set(bottles.map((b) => b.id));
}

/**
 * Devuelve stock al inventario (para devoluciones).
 * @param productId - ID del producto
 * @param quantity - Cantidad a devolver (en unidades o oz según categoría)
 * @param useUnits - true si el producto se mide en unidades
 * @returns true si se pudo devolver, false si el producto no existe
 */
export function addStockToProduct(
  productId: string,
  quantity: number,
  useUnits: boolean
): boolean {
  const bottles = loadInventory();
  const idx = bottles.findIndex((b) => b.id === productId);
  if (idx === -1) return false;
  const b = bottles[idx];
  if (useUnits) {
    const curr = b.currentUnits ?? 0;
    bottles[idx] = { ...b, currentUnits: curr + quantity };
  } else {
    const currOz = b.currentOz ?? 0;
    const addOz = quantity * 29.57; // oz por unidad
    bottles[idx] = { ...b, currentOz: currOz + addOz };
  }
  saveInventory(bottles);
  return true;
}
