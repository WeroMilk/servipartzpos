"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DollarSign, Loader2, Check } from "lucide-react";
import {
  calculateShiftSummary,
  saveCashCount,
} from "@/lib/cashCountService";
import { getShiftById, closeShift } from "@/lib/shiftService";
import type { PaymentMethod } from "@/lib/types";

const METHOD_LABELS: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  tarjeta_debito: "Tarjeta débito",
  tarjeta_credito: "Tarjeta crédito",
  transferencia: "Transferencia",
};

function CorteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const shiftId = searchParams.get("shiftId");

  const [actualCash, setActualCash] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<ReturnType<typeof calculateShiftSummary> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (shiftId) {
      const shift = getShiftById(shiftId);
      if (!shift || shift.status === "closed") {
        setError("Turno no encontrado o ya cerrado");
        return;
      }
      setSummary(calculateShiftSummary(shiftId));
    } else {
      setError("Falta el ID del turno");
    }
  }, [shiftId]);

  const handleConfirm = () => {
    if (!shiftId || !summary) return;
    const actual = parseFloat(actualCash.replace(",", ".")) || 0;
    if (actual < 0) {
      setError("El monto contado debe ser mayor o igual a 0");
      return;
    }
    setLoading(true);
    setError("");
    try {
      saveCashCount(shiftId, actual, summary);
      closeShift(shiftId);
      router.push("/turnos");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cerrar turno");
    } finally {
      setLoading(false);
    }
  };

  if (error && !summary) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4">
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <a href="/turnos" className="text-primary-600 font-medium">
          Volver a Turnos
        </a>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const actualNum = parseFloat(actualCash.replace(",", ".")) || 0;
  const difference = actualNum - summary.expectedCash;

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden">
      <div className="flex-shrink-0 px-4 pt-2 pb-1">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary-600" />
          Corte de caja
        </h2>
        <p className="text-xs text-slate-500">Conteo de efectivo y cierre de turno</p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
          <h3 className="font-semibold text-slate-900">Ventas por método de pago</h3>
          {(
            Object.entries(summary.salesByMethod) as [PaymentMethod, number][]
          ).map(([method, amount]) =>
            amount > 0 ? (
              <div key={method} className="flex justify-between text-sm">
                <span className="text-slate-600">{METHOD_LABELS[method]}</span>
                <span className="font-medium">
                  ${amount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </span>
              </div>
            ) : null
          )}
          <div className="flex justify-between font-semibold pt-2 border-t border-slate-200">
            <span>Total ventas</span>
            <span className="text-emerald-600">
              ${summary.totalSales.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Fondo inicial</span>
            <span>${summary.initialCash.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">+ Efectivo cobrado</span>
            <span>${summary.efectivoCollected.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">- Cambios dados</span>
            <span>${summary.changeGiven.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between font-semibold pt-2 border-t border-slate-200">
            <span>Efectivo esperado</span>
            <span className="text-emerald-600">
              ${summary.expectedCash.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Efectivo contado (conteo físico)
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={actualCash}
              onChange={(e) => setActualCash(e.target.value)}
              className="w-full pl-10 pr-4 py-4 text-xl font-semibold border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500"
            />
          </div>
          {actualCash && (
            <div className="mt-2">
              <span className="text-sm text-slate-600">Diferencia: </span>
              <span
                className={`font-semibold ${
                  Math.abs(difference) < 0.01
                    ? "text-emerald-600"
                    : difference > 0
                      ? "text-amber-600"
                      : "text-red-600"
                }`}
              >
                {Math.abs(difference) < 0.01
                  ? "Cuadra"
                  : `${difference > 0 ? "+" : ""}$${difference.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`}
              </span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading}
          className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Check className="w-5 h-5" />
          )}
          Cerrar turno y guardar corte
        </button>

        <a
          href="/turnos"
          className="block text-center text-sm text-slate-500 hover:text-slate-700"
        >
          Cancelar
        </a>
      </div>
    </div>
  );
}

export default function CortePage() {
  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      }
    >
      <CorteContent />
    </Suspense>
  );
}
