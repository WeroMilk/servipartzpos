/**
 * Registro de ventas completas para corte de caja y devoluciones.
 * Almacena cada venta con ticket, items, pagos y turno.
 */

import type { SaleItem, PaymentSplit, SaleRecord, PaymentMethod } from "./types";

const REGISTRY_KEY = "servipartz-sales-registry";
const MAX_RECORDS = 5000;

function getRegistry(): SaleRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(REGISTRY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as (Omit<SaleRecord, "timestamp"> & { timestamp: string })[];
    return (Array.isArray(parsed) ? parsed : []).map((r) => ({
      ...r,
      timestamp: new Date(r.timestamp),
    }));
  } catch {
    return [];
  }
}

function saveRegistry(records: SaleRecord[]) {
  try {
    const toSave = records.slice(0, MAX_RECORDS);
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(toSave));
  } catch {
    // ignore
  }
}

export interface SaleRecordInput {
  ticketNumber: number;
  storeId: string;
  shiftId?: string;
  items: SaleItem[];
  total: number;
  subtotalBeforeDiscount?: number;
  discountTotal?: number;
  payments?: PaymentSplit[];
  paymentMethod?: PaymentMethod;
  amountReceived?: number;
  change?: number;
  employeeName?: string;
  type?: "sale" | "return" | "void";
  originalTicketNumber?: number;
}

/** Añade una venta al registro */
export function addSaleRecord(input: SaleRecordInput): SaleRecord {
  const records = getRegistry();
  const id = `sale-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const record: SaleRecord = {
    ...input,
    id,
    timestamp: new Date(),
  };
  records.unshift(record);
  saveRegistry(records);
  return record;
}

/** Obtiene ventas por turno */
export function getSalesByShift(shiftId: string): SaleRecord[] {
  const records = getRegistry();
  return records.filter(
    (r) => r.shiftId === shiftId && (r.type === "sale" || !r.type)
  );
}

/** Busca venta por número de ticket y tienda */
export function getSaleByTicket(storeId: string, ticketNumber: number): SaleRecord | null {
  const records = getRegistry();
  return (
    records.find(
      (r) =>
        r.storeId === storeId &&
        r.ticketNumber === ticketNumber &&
        (r.type === "sale" || !r.type)
    ) ?? null
  );
}

/** Obtiene todas las ventas de una tienda (últimas N) */
export function getSalesByStore(storeId: string, limit = 500): SaleRecord[] {
  const records = getRegistry();
  return records
    .filter((r) => r.storeId === storeId && (r.type === "sale" || !r.type))
    .slice(0, limit);
}
