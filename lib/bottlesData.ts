import { Category, Bottle } from "./types";
import { PRODUCT_CATEGORIES, DEFAULT_PRODUCTS } from "./productsData";

/** Categorías de repuestos (electrodomésticos) - Servipartz */
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
  };
}

/** Productos por defecto (repuestos de electrodomésticos) */
export const defaultBottles: Bottle[] = DEFAULT_PRODUCTS.map((p) =>
  productToBottle(p, 0)
);
