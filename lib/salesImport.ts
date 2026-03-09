/**
 * Lectura del informe de ventas (Excel/CSV) y aplicación al inventario.
 */

import { Bottle } from "./types";
import { isMeasuredInUnits } from "./measurementRules";

const BAR_BOTTLES_KEY = "barra-bar-bottles";

export interface SalesRow {
  /** Nombre del producto (se hace match con bottle.name) */
  productName: string;
  /** Cantidad vendida (copas/unidades según corresponda) */
  quantitySold: number;
}

/**
 * Obtiene las botellas actuales del bar desde localStorage.
 */
export function getBarBottles(): Bottle[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BAR_BOTTLES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Bottle[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Guarda las botellas actualizadas en localStorage.
 */
export function saveBarBottles(bottles: Bottle[]): void {
  localStorage.setItem(BAR_BOTTLES_KEY, JSON.stringify(bottles));
}

/**
 * Normaliza nombre para match (minúsculas, sin acentos, sin espacios extra).
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Encuentra la botella que mejor coincide con el nombre del producto.
 * Acepta "Nombre 750 ml" (de la plantilla Excel) y hace match por nombre + size.
 */
function findMatchingBottle(productName: string, bottles: Bottle[]): Bottle | null {
  const norm = normalizeName(productName);
  if (!norm) return null;
  // Match "Nombre 750 ml" o "Nombre 750ml" -> nombre + size
  const mlSuffix = /^(.+?)\s+(\d+)\s*ml$/i.exec(norm);
  if (mlSuffix) {
    const namePart = mlSuffix[1].trim();
    const sizeMl = parseInt(mlSuffix[2], 10);
    const byNameAndSize = bottles.find(
      (b) => normalizeName(b.name) === namePart && b.size === sizeMl
    );
    if (byNameAndSize) return byNameAndSize;
  }
  // Match exacto normalizado (solo nombre)
  const exact = bottles.find((b) => normalizeName(b.name) === norm);
  if (exact) return exact;
  // Contiene el nombre de la botella
  for (const b of bottles) {
    if (norm.includes(normalizeName(b.name)) || normalizeName(b.name).includes(norm)) return b;
  }
  return null;
}

const ML_TO_OZ = 0.033814;

/**
 * Aplica ventas al inventario: descuenta por cada fila de venta.
 * portionOz o portionUnits es lo que se descuenta por cada "venta" (1 cobro = 1 porción).
 */
export interface ApplySalesOptions {
  bottles: Bottle[];
  sales: SalesRow[];
  /** Oz a descontar por venta (licores). Si no se usa, se usa portionUnits para cerveza. */
  portionOz?: number;
  /** Unidades a descontar por venta (cerveza). */
  portionUnits?: number;
  /** Por botella: (bottle) => oz o unidades por venta. Si no se da, se usa portionOz/portionUnits global. */
  getPortion?: (bottle: Bottle) => number;
}

export interface ApplySalesResult {
  updatedBottles: Bottle[];
  applied: { bottleName: string; deducted: number; unit: "oz" | "units"; matched: boolean }[];
  unmatched: string[];
}

export function applySalesToInventory(options: ApplySalesOptions): ApplySalesResult {
  const { bottles, sales, portionOz = 1, portionUnits = 1, getPortion } = options;
  const updated = bottles.map((b) => ({ ...b }));
  const applied: ApplySalesResult["applied"] = [];
  const unmatched: string[] = [];

  for (const row of sales) {
    const bottle = findMatchingBottle(row.productName, updated);
    if (!bottle) {
      unmatched.push(row.productName);
      continue;
    }
    const portion = getPortion ? getPortion(bottle) : isMeasuredInUnits(bottle.category) ? portionUnits : portionOz;
    const quantitySold = Number(row.quantitySold) || 0;
    if (quantitySold <= 0) continue;
    const toDeduct = quantitySold * portion;
    const index = updated.findIndex((bu) => bu.id === bottle.id);
    if (index === -1) continue;

    const b = updated[index];
    const useUnits = isMeasuredInUnits(b.category);

    if (useUnits) {
      const current = Number(b.currentUnits) ?? 0;
      const safeCurrent = Number.isFinite(current) ? current : 0;
      const toDeductRounded = Math.round(toDeduct);
      const newUnits = Math.max(0, safeCurrent - toDeductRounded);
      const actualDeducted = safeCurrent - newUnits;
      const capacity = Number(b.sizeUnits) || 100;
      const sizeMl = Number(b.size) || 750;
      updated[index] = {
        ...b,
        currentUnits: newUnits,
        currentOz: capacity > 0 ? (newUnits / capacity) * sizeMl : 0,
      };
      applied.push({ bottleName: b.name, deducted: actualDeducted, unit: "units", matched: true });
    } else {
      const currentOzMl = Number(b.currentOz) || 0;
      const safeOzMl = Number.isFinite(currentOzMl) ? currentOzMl : 0;
      const currentOz = safeOzMl * ML_TO_OZ;
      const toDeductCapped = Math.min(toDeduct, currentOz);
      const newOz = Math.max(0, currentOz - toDeductCapped);
      const newOzMl = newOz / ML_TO_OZ;
      updated[index] = {
        ...b,
        currentOz: newOzMl,
      };
      applied.push({ bottleName: b.name, deducted: toDeductCapped, unit: "oz", matched: true });
    }
  }

  return { updatedBottles: updated, applied, unmatched };
}

/** Obtiene la clave real del objeto (insensible a mayúsculas) que coincide con el patrón. */
function getColumnKey(row: { [key: string]: unknown }, pattern: RegExp, fallbackIndex: number): string {
  const keys = Object.keys(row);
  const lower = keys.map((k) => k.toLowerCase());
  const i = lower.findIndex((h) => pattern.test(h));
  if (i !== -1) return keys[i];
  return keys[Math.min(fallbackIndex, keys.length - 1)] ?? "";
}

/**
 * Convierte la primera hoja de un libro XLSX en filas de ventas.
 * Acepta columnas "Producto"/"Nombre" y "Cantidad"/"Vendido" (cualquier capitalización).
 */
export function sheetToSalesRows(firstSheet: { [key: string]: unknown }[]): SalesRow[] {
  if (!firstSheet || firstSheet.length === 0) return [];
  const rows: SalesRow[] = [];
  const firstRow = firstSheet[0] || {};

  const nameKey = getColumnKey(firstRow, /producto|nombre|item|articulo|descripcion|name|product/, 0);
  const qtyKey = getColumnKey(firstRow, /cantidad|vendido|venta|qty|quantity|unidades|sales/, 1);

  for (const row of firstSheet) {
    const rawName = row[nameKey] ?? row[Object.keys(row)[0]];
    const rawQty = row[qtyKey] ?? row[Object.keys(row)[1]];
    const name = typeof rawName === "string" ? rawName.trim() : String(rawName ?? "").trim();
    const qty = typeof rawQty === "number" ? rawQty : parseFloat(String(rawQty ?? "0").replace(",", "."));
    if (name && !Number.isNaN(qty) && qty > 0) {
      rows.push({ productName: name, quantitySold: qty });
    }
  }
  return rows;
}
