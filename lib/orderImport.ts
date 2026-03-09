/**
 * Lectura del Excel/CSV de pedido y suma al inventario (añadir stock).
 */

import { Bottle } from "./types";
import { isMeasuredInUnits } from "./measurementRules";

const ML_TO_OZ = 0.033814;

export interface OrderRow {
  productName: string;
  quantityToAdd: number;
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Encuentra la botella que coincide con el producto.
 * Acepta "Nombre 750 ml" (de la plantilla Excel) y hace match por nombre + size.
 */
function findMatchingBottle(productName: string, bottles: Bottle[]): Bottle | null {
  const norm = normalizeName(productName);
  if (!norm) return null;
  const mlSuffix = /^(.+?)\s+(\d+)\s*ml$/i.exec(norm);
  if (mlSuffix) {
    const namePart = mlSuffix[1].trim();
    const sizeMl = parseInt(mlSuffix[2], 10);
    const byNameAndSize = bottles.find(
      (b) => normalizeName(b.name) === namePart && b.size === sizeMl
    );
    if (byNameAndSize) return byNameAndSize;
  }
  const exact = bottles.find((b) => normalizeName(b.name) === norm);
  if (exact) return exact;
  for (const b of bottles) {
    if (norm.includes(normalizeName(b.name)) || normalizeName(b.name).includes(norm)) return b;
  }
  return null;
}

export interface ApplyOrderResult {
  updatedBottles: Bottle[];
  applied: { bottleName: string; added: number; unit: "oz" | "units" }[];
  unmatched: string[];
}

/**
 * Aplica el pedido al inventario: suma cantidad por cada fila.
 * Licores: quantityToAdd = número de BOTELLAS a sumar (cada una de size ml).
 * Cerveza: quantityToAdd = unidades (latas/botellas) a sumar.
 */
export function applyOrderToInventory(bottles: Bottle[], rows: OrderRow[]): ApplyOrderResult {
  const updated = bottles.map((b) => ({ ...b }));
  const applied: ApplyOrderResult["applied"] = [];
  const unmatched: string[] = [];

  for (const row of rows) {
    const bottle = findMatchingBottle(row.productName, updated);
    if (!bottle) {
      unmatched.push(row.productName);
      continue;
    }
    const index = updated.findIndex((b) => b.id === bottle.id);
    if (index === -1) continue;

    const b = updated[index];
    const useUnits = isMeasuredInUnits(b.category);
    const toAdd = Math.max(0, Number(row.quantityToAdd) || 0);

    if (useUnits) {
      // Cerveza: cantidad = unidades (latas/botellas) a sumar
      const capacity = Number(b.sizeUnits) || 100;
      const current = Number(b.currentUnits) ?? 0;
      const addUnits = Math.round(toAdd);
      const newUnits = Math.min(capacity, Math.max(0, current + addUnits));
      updated[index] = {
        ...b,
        currentUnits: newUnits,
        currentOz: capacity > 0 ? (newUnits / capacity) * (Number(b.size) || 0) : 0,
      };
      applied.push({ bottleName: b.name, added: newUnits - current, unit: "units" });
    } else {
      // Licores: cantidad = número de BOTELLAS a sumar (cada botella = size ml)
      const currentOzMl = Number(b.currentOz) || 0;
      const sizeMl = Number(b.size) || 750;
      const bottlesToAdd = Math.round(toAdd);
      const addMl = bottlesToAdd * sizeMl;
      const newCurrentOzMl = Math.max(0, currentOzMl + addMl);
      const sizeOz = sizeMl * ML_TO_OZ;
      updated[index] = { ...b, currentOz: newCurrentOzMl };
      applied.push({ bottleName: b.name, added: bottlesToAdd * sizeOz, unit: "oz" });
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
 * Convierte la primera hoja del Excel en filas de pedido (producto, cantidad a sumar).
 * Acepta columnas "Producto"/"Nombre" y "Cantidad" (cualquier capitalización).
 */
export function sheetToOrderRows(firstSheet: { [key: string]: unknown }[]): OrderRow[] {
  if (!firstSheet || firstSheet.length === 0) return [];
  const rows: OrderRow[] = [];
  const firstRow = firstSheet[0] || {};

  const nameKey = getColumnKey(firstRow, /producto|nombre|item|articulo|descripcion|name|product|pedido/, 0);
  const qtyKey = getColumnKey(firstRow, /cantidad|sumar|agregar|entrada|qty|quantity|unidades|añadir|anadir/, 1);

  for (const row of firstSheet) {
    const rawName = row[nameKey] ?? row[Object.keys(row)[0]];
    const rawQty = row[qtyKey] ?? row[Object.keys(row)[1]];
    const name = typeof rawName === "string" ? rawName.trim() : String(rawName ?? "").trim();
    const qty = typeof rawQty === "number" ? rawQty : parseFloat(String(rawQty ?? "0").replace(",", "."));
    if (name && !Number.isNaN(qty) && qty >= 0) {
      rows.push({ productName: name, quantityToAdd: qty });
    }
  }
  return rows;
}
