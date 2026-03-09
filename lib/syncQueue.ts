/**
 * Cola de sincronización para operaciones pendientes cuando Firebase falla o está offline.
 * Al recuperar conexión, se procesan las operaciones en orden.
 */

import { addSale, updateProductStock, addMovement } from "./firestore";
import { addSalesFromImport } from "./salesReport";
import { useFirebase } from "./firebase";
import { storeStore } from "./storeStore";
import type { SaleItem, PaymentMethod } from "./types";

const QUEUE_KEY = "servipartz-sync-queue";

export interface PendingSale {
  type: "sale";
  storeId: string;
  items: SaleItem[];
  total: number;
  employeeName?: string;
  paymentMethod?: PaymentMethod;
  amountReceived?: number;
  change?: number;
  ticketNumber?: number;
  productStocks: { productId: string; productName: string; oldStock: number; newStock: number }[];
}

function getQueue(): PendingSale[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PendingSale[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: PendingSale[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // ignore
  }
}

/** Añade una venta pendiente a la cola (cuando Firebase falla) */
export function enqueueSale(sale: PendingSale): void {
  const queue = getQueue();
  queue.push(sale);
  saveQueue(queue);
}

/** Procesa la cola de ventas pendientes. Retorna el número de ventas procesadas. */
export async function processQueue(): Promise<number> {
  if (!useFirebase) return 0;
  const queue = getQueue();
  if (queue.length === 0) return 0;

  let processed = 0;
  const remaining: PendingSale[] = [];

  for (const sale of queue) {
    if (sale.type !== "sale") continue;
    try {
      await addSale(
        sale.storeId,
        sale.items,
        sale.total,
        undefined,
        sale.employeeName,
        {
          paymentMethod: sale.paymentMethod,
          amountReceived: sale.amountReceived,
          change: sale.change,
          ticketNumber: sale.ticketNumber,
        }
      );
      for (const ps of sale.productStocks) {
        await updateProductStock(sale.storeId, ps.productId, ps.newStock, ps.productName);
        await addMovement(sale.storeId, {
          productId: ps.productId,
          productName: ps.productName,
          type: "sale",
          oldValue: ps.oldStock,
          newValue: ps.newStock,
          userName: sale.employeeName ?? "Caja",
        });
      }
      processed++;
    } catch {
      remaining.push(sale);
    }
  }

  saveQueue(remaining);
  return processed;
}

/** Cantidad de operaciones pendientes en la cola */
export function getQueueLength(): number {
  return getQueue().length;
}

/** Registra la venta localmente para reportes (siempre, como plan B) */
export function registerSaleLocally(
  items: { name: string; quantity: number; price?: number }[],
  timestamp: Date
): void {
  addSalesFromImport(items, timestamp);
}
