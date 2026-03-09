"use client";

import { useState } from "react";
import { Banknote, CreditCard, Smartphone, X } from "lucide-react";
import type { PaymentMethod } from "@/lib/types";

interface PaymentModalProps {
  total: number;
  onConfirm: (payment: {
    method: PaymentMethod;
    amountReceived?: number;
    change?: number;
  }) => void;
  onClose: () => void;
}

export default function PaymentModal({ total, onConfirm, onClose }: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>("efectivo");
  const [amountReceived, setAmountReceived] = useState("");
  const [error, setError] = useState("");

  const amountNum = parseFloat(amountReceived.replace(",", ".")) || 0;
  const change = method === "efectivo" && amountNum >= total ? amountNum - total : 0;
  const canConfirm =
    method !== "efectivo" || (amountNum >= total && amountNum > 0);

  const handleConfirm = () => {
    if (!canConfirm) {
      setError(method === "efectivo" ? "El monto debe ser mayor o igual al total" : "");
      return;
    }
    setError("");
    onConfirm({
      method,
      amountReceived: method === "efectivo" ? amountNum : undefined,
      change: method === "efectivo" ? change : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <h3 className="text-lg font-semibold text-slate-900">Método de pago</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <p className="text-sm text-slate-500 mb-1">Total a cobrar</p>
            <p className="text-2xl font-bold text-slate-900">
              ${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Selecciona el método</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMethod("efectivo")}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-colors ${
                  method === "efectivo"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <Banknote className="w-6 h-6" />
                <span className="text-xs font-medium">Efectivo</span>
              </button>
              <button
                type="button"
                onClick={() => setMethod("tarjeta")}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-colors ${
                  method === "tarjeta"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <CreditCard className="w-6 h-6" />
                <span className="text-xs font-medium">Tarjeta</span>
              </button>
              <button
                type="button"
                onClick={() => setMethod("transferencia")}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-colors ${
                  method === "transferencia"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <Smartphone className="w-6 h-6" />
                <span className="text-xs font-medium">Transferencia</span>
              </button>
            </div>
          </div>

          {method === "efectivo" && (
            <div>
              <label htmlFor="amount-received" className="block text-sm font-medium text-slate-700 mb-1">
                Monto recibido
              </label>
              <input
                id="amount-received"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 text-lg border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              {amountNum >= total && amountNum > 0 && (
                <p className="mt-2 text-sm font-semibold text-emerald-600">
                  Cambio a devolver: ${change.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </p>
              )}
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="p-4 border-t border-slate-200">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="w-full py-4 bg-emerald-600 text-white font-bold text-lg rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirmar cobro
          </button>
        </div>
      </div>
    </div>
  );
}
