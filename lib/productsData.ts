import type { Product } from "./types";

export const PRODUCT_CATEGORIES = [
  { id: "refrigeradores", label: "Refrigeradores" },
  { id: "licuadoras", label: "Licuadoras" },
  { id: "lavadoras", label: "Lavadoras" },
  { id: "microondas", label: "Microondas" },
  { id: "estufas", label: "Estufas" },
  { id: "aires", label: "Aires acondicionados" },
  { id: "soldadura", label: "Soldadura" },
  { id: "industrial", label: "Refrigeración industrial" },
  { id: "otros", label: "Otros" },
] as const;

export type ProductCategoryId = (typeof PRODUCT_CATEGORIES)[number]["id"];

/** Catálogo base de repuestos (desde Servipartz). Stock inicial 0; cada tienda define su inventario. */
export const DEFAULT_PRODUCTS: Omit<Product, "stock">[] = [
  { id: "1", name: "Compresor refrigerador 1/4 HP", category: "refrigeradores", sku: "COMP-025", price: 0 },
  { id: "2", name: "Evaporador refrigerador doméstico", category: "refrigeradores", sku: "EVA-DOM", price: 0 },
  { id: "3", name: "Motor licuadora Oster", category: "licuadoras", sku: "MOT-OST", price: 0 },
  { id: "4", name: "Cuchilla licuadora universal", category: "licuadoras", sku: "CUC-LIC", price: 0 },
  { id: "5", name: "Bomba de agua lavadora", category: "lavadoras", sku: "BOM-LAV", price: 0 },
  { id: "6", name: "Resistencia lavadora", category: "lavadoras", sku: "RES-LAV", price: 0 },
  { id: "7", name: "Magnetrón microondas", category: "microondas", sku: "MAG-MIC", price: 0 },
  { id: "8", name: "Plato giratorio microondas", category: "microondas", sku: "PLA-MIC", price: 0 },
  { id: "9", name: "Quemador estufa", category: "estufas", sku: "QUE-EST", price: 0 },
  { id: "10", name: "Termostato estufa", category: "estufas", sku: "TER-EST", price: 0 },
  { id: "11", name: "Condensador minisplit", category: "aires", sku: "CON-MIN", price: 0 },
  { id: "12", name: "Ventilador evaporador", category: "aires", sku: "VEN-EVA", price: 0 },
  { id: "13", name: "Electrodo soldadura", category: "soldadura", sku: "ELE-SOL", price: 0 },
  { id: "14", name: "Careta soldadura", category: "soldadura", sku: "CAR-SOL", price: 0 },
  { id: "15", name: "Compresor refrigeración industrial", category: "industrial", sku: "COMP-IND", price: 0 },
  { id: "16", name: "Válvula expansión industrial", category: "industrial", sku: "VAL-IND", price: 0 },
  { id: "17", name: "Capacitor arranque universal", category: "otros", sku: "CAP-UNI", price: 0 },
  { id: "18", name: "Relé de arranque", category: "otros", sku: "REL-ARR", price: 0 },
];

export function getDefaultProductsWithStock(stock = 0): Product[] {
  return DEFAULT_PRODUCTS.map((p) => ({ ...p, stock }));
}

export function getProductsByCategory(products: Product[], category: string): Product[] {
  return products.filter((p) => p.category === category);
}

export function getProductById(products: Product[], id: string): Product | undefined {
  return products.find((p) => p.id === id);
}
