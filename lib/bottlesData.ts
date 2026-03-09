import { Category, Bottle } from "./types";
import { PRODUCT_CATEGORIES, DEFAULT_PRODUCTS } from "./productsData";

/** Categorías de repuestos (electrodomésticos) - SERVIPARTZ */
export const categories: Category[] = PRODUCT_CATEGORIES.map((c) => ({
  id: c.id,
  name: c.label,
}));

/**
 * Convierte productos a formato Bottle (compatibilidad).
 * Para repuestos: stock = currentUnits, size=1, currentOz=0.
 */
function productToBottle(p: { id: string; name: string; category: string; sku?: string; price?: number }, stock = 0): Bottle {
  const capacity = 100;
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    size: capacity,
    currentOz: 0,
    sizeUnits: capacity,
    currentUnits: stock,
    price: p.price ?? 0,
  };
}

/** Stock demo variado (5-45) para visualizar inventario */
const DEMO_STOCK = [12, 8, 25, 5, 18, 30, 14, 9, 22, 7, 35, 11, 40, 6, 20, 15, 28, 3, 42, 19, 33, 10, 45, 16, 24, 4, 38, 21, 13, 27, 36, 17, 31, 23, 29, 8, 44, 26, 32, 37, 41, 34, 39, 43, 18, 22, 15, 28, 12, 20];

/** Productos por defecto (repuestos de electrodomésticos) con stock demo */
export const defaultBottles: Bottle[] = DEFAULT_PRODUCTS.map((p, i) =>
  productToBottle(p, DEMO_STOCK[i] ?? 10)
);
