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

/** Catálogo base de repuestos (desde Servipartz). Stock inicial variado para demo. */
export const DEFAULT_PRODUCTS: Omit<Product, "stock">[] = [
  // Refrigeradores (8)
  { id: "1", name: "Compresor refrigerador 1/4 HP", category: "refrigeradores", sku: "COMP-025", price: 450 },
  { id: "2", name: "Evaporador refrigerador doméstico", category: "refrigeradores", sku: "EVA-DOM", price: 380 },
  { id: "3", name: "Termostato refrigerador digital", category: "refrigeradores", sku: "TER-REF", price: 120 },
  { id: "4", name: "Resistencia descongelador", category: "refrigeradores", sku: "RES-DES", price: 95 },
  { id: "5", name: "Ventilador evaporador refrigerador", category: "refrigeradores", sku: "VEN-REF", price: 180 },
  { id: "6", name: "Compresor 1/3 HP", category: "refrigeradores", sku: "COMP-033", price: 520 },
  { id: "7", name: "Filtro deshidratador", category: "refrigeradores", sku: "FIL-DES", price: 85 },
  { id: "8", name: "Capilar refrigerador", category: "refrigeradores", sku: "CAP-REF", price: 65 },
  // Licuadoras (6)
  { id: "9", name: "Motor licuadora Oster", category: "licuadoras", sku: "MOT-OST", price: 220 },
  { id: "10", name: "Cuchilla licuadora universal", category: "licuadoras", sku: "CUC-LIC", price: 80 },
  { id: "11", name: "Vaso licuadora vidrio 1.5L", category: "licuadoras", sku: "VAS-LIC", price: 150 },
  { id: "12", name: "Sello base licuadora", category: "licuadoras", sku: "SEL-LIC", price: 45 },
  { id: "13", name: "Motor licuadora Black+Decker", category: "licuadoras", sku: "MOT-BD", price: 195 },
  { id: "14", name: "Base plástica licuadora", category: "licuadoras", sku: "BAS-LIC", price: 55 },
  // Lavadoras (7)
  { id: "15", name: "Bomba de agua lavadora", category: "lavadoras", sku: "BOM-LAV", price: 280 },
  { id: "16", name: "Resistencia lavadora", category: "lavadoras", sku: "RES-LAV", price: 120 },
  { id: "17", name: "Solenoide válvula lavadora", category: "lavadoras", sku: "SOL-LAV", price: 95 },
  { id: "18", name: "Transmisión lavadora Mabe", category: "lavadoras", sku: "TRA-LAV", price: 450 },
  { id: "19", name: "Sensador nivel agua", category: "lavadoras", sku: "SEN-LAV", price: 75 },
  { id: "20", name: "Rodamiento tambor lavadora", category: "lavadoras", sku: "ROD-LAV", price: 180 },
  { id: "21", name: "Correa lavadora", category: "lavadoras", sku: "COR-LAV", price: 45 },
  // Microondas (5)
  { id: "22", name: "Magnetrón microondas", category: "microondas", sku: "MAG-MIC", price: 350 },
  { id: "23", name: "Plato giratorio microondas", category: "microondas", sku: "PLA-MIC", price: 85 },
  { id: "24", name: "Capacitor microondas", category: "microondas", sku: "CAP-MIC", price: 95 },
  { id: "25", name: "Diodo microondas", category: "microondas", sku: "DIO-MIC", price: 65 },
  { id: "26", name: "Interruptor puerta microondas", category: "microondas", sku: "INT-MIC", price: 110 },
  // Estufas (5)
  { id: "27", name: "Quemador estufa", category: "estufas", sku: "QUE-EST", price: 180 },
  { id: "28", name: "Termostato estufa", category: "estufas", sku: "TER-EST", price: 95 },
  { id: "29", name: "Encendedor piezoeléctrico", category: "estufas", sku: "ENC-EST", price: 55 },
  { id: "30", name: "Valvulina estufa", category: "estufas", sku: "VAL-EST", price: 75 },
  { id: "31", name: "Horno estufa resistencia", category: "estufas", sku: "HOR-EST", price: 140 },
  // Aires acondicionados (6)
  { id: "32", name: "Condensador minisplit", category: "aires", sku: "CON-MIN", price: 420 },
  { id: "33", name: "Ventilador evaporador", category: "aires", sku: "VEN-EVA", price: 150 },
  { id: "34", name: "Compresor minisplit 1 ton", category: "aires", sku: "COM-MIN", price: 580 },
  { id: "35", name: "Capacitor ventilador aire", category: "aires", sku: "CAP-AIR", price: 95 },
  { id: "36", name: "Control remoto universal", category: "aires", sku: "CTR-AIR", price: 120 },
  { id: "37", name: "Filtro aire acondicionado", category: "aires", sku: "FIL-AIR", price: 45 },
  // Soldadura (4)
  { id: "38", name: "Electrodo soldadura", category: "soldadura", sku: "ELE-SOL", price: 85 },
  { id: "39", name: "Careta soldadura", category: "soldadura", sku: "CAR-SOL", price: 120 },
  { id: "40", name: "Guante soldadura", category: "soldadura", sku: "GUA-SOL", price: 55 },
  { id: "41", name: "Cable tierra soldadora", category: "soldadura", sku: "CAB-SOL", price: 75 },
  // Refrigeración industrial (4)
  { id: "42", name: "Compresor refrigeración industrial", category: "industrial", sku: "COMP-IND", price: 720 },
  { id: "43", name: "Válvula expansión industrial", category: "industrial", sku: "VAL-IND", price: 180 },
  { id: "44", name: "Evaporador industrial", category: "industrial", sku: "EVA-IND", price: 380 },
  { id: "45", name: "Presostato industrial", category: "industrial", sku: "PRE-IND", price: 95 },
  // Otros (5)
  { id: "46", name: "Capacitor arranque universal", category: "otros", sku: "CAP-UNI", price: 120 },
  { id: "47", name: "Relé de arranque", category: "otros", sku: "REL-ARR", price: 85 },
  { id: "48", name: "Contactor 3 polos", category: "otros", sku: "CON-TRI", price: 250 },
  { id: "49", name: "Manómetro refrigeración", category: "otros", sku: "MAN-REF", price: 95 },
  { id: "50", name: "Bomba vacío refrigeración", category: "otros", sku: "BOM-VAC", price: 420 },
];

export function getDefaultProductsWithStock(stock = 0): Product[] {
  return DEFAULT_PRODUCTS.map((p) => ({ ...p, stock, barcode: p.barcode ?? p.sku }));
}

export function getProductsByCategory(products: Product[], category: string): Product[] {
  return products.filter((p) => p.category === category);
}

export function getProductById(products: Product[], id: string): Product | undefined {
  return products.find((p) => p.id === id);
}
