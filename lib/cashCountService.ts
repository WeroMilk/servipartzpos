/**
 * Corte de caja / Arqueo: cálculo de efectivo esperado vs real.
 */

import type { PaymentMethod } from "./types";
import { getSalesByShift } from "./salesRegistry";
import { getShiftById } from "./shiftService";

export interface CashCount {
  shiftId: string;
  expectedCash: number;
  actualCash: number;
  difference: number;
  salesByMethod: Record<PaymentMethod, number>;
  totalSales: number;
  closedAt: Date;
}

const CASH_COUNTS_KEY = "servipartz-cash-counts";

function getCashCounts(): (Omit<CashCount, "closedAt"> & { closedAt: string })[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CASH_COUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCashCounts(
  counts: (Omit<CashCount, "closedAt"> & { closedAt: string })[]
) {
  try {
    localStorage.setItem(CASH_COUNTS_KEY, JSON.stringify(counts));
  } catch {
    // ignore
  }
}

const DEFAULT_BY_METHOD: Record<PaymentMethod, number> = {
  efectivo: 0,
  tarjeta: 0,
  tarjeta_debito: 0,
  tarjeta_credito: 0,
  transferencia: 0,
};

/** Calcula el resumen de ventas del turno y el efectivo esperado */
export function calculateShiftSummary(shiftId: string): {
  salesByMethod: Record<PaymentMethod, number>;
  totalSales: number;
  efectivoCollected: number;
  changeGiven: number;
  expectedCash: number;
  initialCash: number;
} {
  const sales = getSalesByShift(shiftId);
  const shift = getShiftById(shiftId);
  if (!shift) {
    return {
      salesByMethod: { ...DEFAULT_BY_METHOD },
      totalSales: 0,
      efectivoCollected: 0,
      changeGiven: 0,
      expectedCash: 0,
      initialCash: 0,
    };
  }

  const salesByMethod: Record<PaymentMethod, number> = { ...DEFAULT_BY_METHOD };
  let efectivoCollected = 0;
  let changeGiven = 0;

  for (const sale of sales) {
    if (sale.payments && sale.payments.length > 0) {
      for (const p of sale.payments) {
        salesByMethod[p.method] = (salesByMethod[p.method] ?? 0) + p.amount;
        if (p.method === "efectivo") {
          efectivoCollected += p.amount;
        }
      }
    } else if (sale.paymentMethod) {
      const m = sale.paymentMethod as PaymentMethod;
      salesByMethod[m] = (salesByMethod[m] ?? 0) + sale.total;
      if (m === "efectivo") {
        efectivoCollected += sale.total;
      }
    }
    changeGiven += sale.change ?? 0;
  }

  const totalSales = sales.reduce((a, s) => a + s.total, 0);
  const expectedCash = shift.initialCash + efectivoCollected - changeGiven;

  return {
    salesByMethod,
    totalSales,
    efectivoCollected,
    changeGiven,
    expectedCash,
    initialCash: shift.initialCash,
  };
}

/** Guarda el resultado del corte de caja */
export function saveCashCount(
  shiftId: string,
  actualCash: number,
  summary: ReturnType<typeof calculateShiftSummary>
): CashCount {
  const counts = getCashCounts();
  const count: Omit<CashCount, "closedAt"> & { closedAt: string } = {
    shiftId,
    expectedCash: summary.expectedCash,
    actualCash,
    difference: actualCash - summary.expectedCash,
    salesByMethod: summary.salesByMethod,
    totalSales: summary.totalSales,
    closedAt: new Date().toISOString(),
  };
  counts.unshift(count);
  saveCashCounts(counts);
  return { ...count, closedAt: new Date(count.closedAt) };
}
