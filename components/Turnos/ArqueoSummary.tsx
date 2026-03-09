"use client";

import { DollarSign, CreditCard, ArrowRightLeft, Wallet } from "lucide-react";
import type { PaymentMethod } from "@/lib/types";

export interface ArqueoData {
  /** Fondo inicial con el que empezó el turno */
  fondoInicial: number;
  /** Cobrado con tarjeta débito + crédito (terminal / vouchers) */
  terminal: number;
  /** Cobrado por transferencia */
  transferencias: number;
  /** Efectivo esperado = fondo + efectivo cobrado - cambios dados */
  efectivoEsperado: number;
  /** Total de ventas del turno */
  totalVentas: number;
}

interface ArqueoSummaryProps {
  data: ArqueoData;
  /** Si es Pre-Corte, no se muestra el total de ventas como resumen final */
  variant?: "pre-corte" | "corte";
}

const ICON_CLASS = "w-5 h-5 text-slate-500 flex-shrink-0";

export function ArqueoSummary({ data, variant = "pre-corte" }: ArqueoSummaryProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600 font-medium">
        {variant === "pre-corte"
          ? "Arqueo: cuenta y verifica que todo cuadre"
          : "Arqueo: cuenta transferencias, vouchers, fondo y efectivo"}
      </p>

      <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-50">
              <Wallet className={ICON_CLASS} />
            </div>
            <div>
              <p className="font-medium text-slate-900">Fondo inicial</p>
              <p className="text-xs text-slate-500">Con lo que empezaste el turno</p>
            </div>
          </div>
          <span className="font-bold text-slate-900 text-lg">
            ${data.fondoInicial.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <CreditCard className={ICON_CLASS} />
            </div>
            <div>
              <p className="font-medium text-slate-900">Terminal (tarjeta débito/crédito)</p>
              <p className="text-xs text-slate-500">Vouchers de la terminal</p>
            </div>
          </div>
          <span className="font-bold text-slate-900 text-lg">
            ${data.terminal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-50">
              <ArrowRightLeft className={ICON_CLASS} />
            </div>
            <div>
              <p className="font-medium text-slate-900">Transferencias</p>
              <p className="text-xs text-slate-500">Pagos por transferencia bancaria</p>
            </div>
          </div>
          <span className="font-bold text-slate-900 text-lg">
            ${data.transferencias.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="flex items-center justify-between p-4 bg-emerald-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100">
              <DollarSign className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Efectivo en caja</p>
              <p className="text-xs text-slate-500">Fondo + efectivo cobrado - cambios dados</p>
            </div>
          </div>
          <span className="font-bold text-emerald-700 text-lg">
            ${data.efectivoEsperado.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {variant === "corte" && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs text-slate-500 mb-1">Total ventas del turno</p>
          <p className="font-semibold text-slate-900">
            ${data.totalVentas.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
          </p>
        </div>
      )}
    </div>
  );
}

/** Convierte el summary de cashCountService al formato ArqueoData */
export function summaryToArqueoData(summary: {
  initialCash: number;
  salesByMethod: Record<PaymentMethod, number>;
  efectivoCollected: number;
  changeGiven: number;
  expectedCash: number;
  totalSales: number;
}): ArqueoData {
  const sm = summary.salesByMethod;
  const terminal = (sm.tarjeta_debito ?? 0) + (sm.tarjeta_credito ?? 0) + (sm.tarjeta ?? 0);
  return {
    fondoInicial: summary.initialCash,
    terminal,
    transferencias: sm.transferencia ?? 0,
    efectivoEsperado: summary.expectedCash,
    totalVentas: summary.totalSales,
  };
}
