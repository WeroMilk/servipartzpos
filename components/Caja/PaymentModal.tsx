"use client";

import { useState, useEffect } from "react";
import { Banknote, CreditCard, Smartphone, X, Plus, Trash2 } from "lucide-react";
import type { PaymentMethod, PaymentSplit } from "@/lib/types";

interface PaymentRow {
  id: string;
  method: PaymentMethod;
  cardType?: "debito" | "credito";
  amount: string;
  amountReceived?: string;
}

function getPaymentMethod(m: PaymentMethod, cardType?: "debito" | "credito"): PaymentMethod {
  if (m === "tarjeta") return cardType === "credito" ? "tarjeta_credito" : "tarjeta_debito";
  return m;
}

interface PaymentModalProps {
  total: number;
  onConfirm: (payment: {
    method?: PaymentMethod;
    payments: PaymentSplit[];
    amountReceived?: number;
    change?: number;
  }) => void;
  onClose: () => void;
}

export default function PaymentModal({ total, onConfirm, onClose }: PaymentModalProps) {
  const [rows, setRows] = useState<PaymentRow[]>([
    { id: "1", method: "efectivo", amount: "", amountReceived: "" },
  ]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Cuando hay un solo pago en efectivo, el monto viene automático desde la caja
  const isSingleEfectivo = rows.length === 1 && rows[0]?.method === "efectivo";
  useEffect(() => {
    setRows((prev) => {
      if (prev.length === 1 && prev[0]?.method === "efectivo") {
        return prev.map((r, i) => (i === 0 ? { ...r, amount: total.toFixed(2) } : r));
      }
      return prev;
    });
  }, [total]);

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}`,
        method: "efectivo",
        amount: "",
        amountReceived: "",
      },
    ]);
  };

  const removeRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateRow = (id: string, updates: Partial<PaymentRow>) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  };

  const totalPaid = rows.reduce((acc, r) => {
    const amt = parseFloat(r.amount.replace(",", ".")) || 0;
    return acc + amt;
  }, 0);

  const efectivoRow = rows.find((r) => r.method === "efectivo");
  const efectivoAmount = efectivoRow ? parseFloat(efectivoRow.amount.replace(",", ".")) || 0 : 0;
  const efectivoReceived = efectivoRow ? parseFloat(efectivoRow.amountReceived?.replace(",", ".") || "0") || 0 : 0;
  const change = efectivoReceived > efectivoAmount ? efectivoReceived - efectivoAmount : 0;

  const canConfirm = totalPaid >= total && totalPaid > 0;

  const handleConfirm = () => {
    if (submitting || !canConfirm) {
      if (!canConfirm) setError(totalPaid < total ? "La suma debe ser mayor o igual al total" : "Completa los datos");
      return;
    }
    if (totalPaid < total) {
      setError("La suma debe ser mayor o igual al total");
      return;
    }
    setError("");
    setSubmitting(true);

    const payments: PaymentSplit[] = rows.map((r) => ({
      method: getPaymentMethod(r.method, r.cardType),
      amount: parseFloat(r.amount.replace(",", ".")) || 0,
    })).filter((p) => p.amount > 0);

    const totalEfectivo = payments.filter((p) => p.method === "efectivo").reduce((a, p) => a + p.amount, 0);
    const amountReceived = totalEfectivo > 0 && efectivoReceived >= totalEfectivo ? efectivoReceived : totalEfectivo > 0 ? totalEfectivo : undefined;
    const changeToGive = amountReceived != null && amountReceived > totalEfectivo ? amountReceived - totalEfectivo : 0;

    onConfirm({
      payments,
      amountReceived: amountReceived && amountReceived > 0 ? amountReceived : undefined,
      change: changeToGive > 0 ? changeToGive : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex-shrink-0 flex items-center justify-between border-b border-slate-200 p-4">
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

        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
          <div>
            <p className="text-sm text-slate-500 mb-1">Total a cobrar</p>
            <p className="text-2xl font-bold text-slate-900">
              ${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-slate-700">Pagos</p>
              <button
                type="button"
                onClick={addRow}
                className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Añadir pago
              </button>
            </div>
            <div className="space-y-3">
              {rows.map((row) => (
                <div key={row.id} className="flex gap-2 items-start p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex gap-2">
                      <select
                        value={row.method}
                        onChange={(e) => {
                          const newMethod = e.target.value as PaymentMethod;
                          const updates: Partial<PaymentRow> = {
                            method: newMethod,
                            cardType: undefined,
                            amountReceived: undefined,
                          };
                          if (rows.length === 1 && newMethod === "efectivo") {
                            updates.amount = total.toFixed(2);
                          }
                          updateRow(row.id, updates);
                        }}
                        className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg"
                      >
                        <option value="efectivo">Efectivo</option>
                        <option value="tarjeta">Tarjeta</option>
                        <option value="transferencia">Transferencia</option>
                      </select>
                      {rows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRow(row.id)}
                          className="p-2 text-slate-400 hover:text-red-600"
                          aria-label="Quitar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {row.method === "tarjeta" && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => updateRow(row.id, { cardType: "debito" })}
                          className={`flex-1 py-2 px-2 text-xs font-medium rounded-lg border ${
                            (row.cardType ?? "debito") === "debito"
                              ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                              : "border-slate-200"
                          }`}
                        >
                          Débito
                        </button>
                        <button
                          type="button"
                          onClick={() => updateRow(row.id, { cardType: "credito" })}
                          className={`flex-1 py-2 px-2 text-xs font-medium rounded-lg border ${
                            row.cardType === "credito"
                              ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                              : "border-slate-200"
                          }`}
                        >
                          Crédito
                        </button>
                      </div>
                    )}
                    <div>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="Monto"
                        value={row.amount}
                        onChange={(e) => updateRow(row.id, { amount: e.target.value })}
                        readOnly={row.method === "efectivo" && isSingleEfectivo}
                        className={`w-full px-3 py-2 text-sm border border-slate-200 rounded-lg ${row.method === "efectivo" && isSingleEfectivo ? "bg-slate-100 cursor-not-allowed" : ""}`}
                      />
                      {row.method === "efectivo" && (
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="Recibido"
                          value={row.amountReceived ?? ""}
                          onChange={(e) => updateRow(row.id, { amountReceived: e.target.value })}
                          className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg"
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between text-sm font-medium">
            <span className="text-slate-600">Total pagado</span>
            <span className={totalPaid >= total ? "text-emerald-600" : "text-slate-900"}>
              ${totalPaid.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </span>
          </div>

          {change > 0 && (
            <p className="text-base font-bold text-emerald-600">
              Cambio a devolver: ${change.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </p>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex-shrink-0 p-4 border-t border-slate-200">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm || submitting}
            className="w-full py-4 bg-emerald-600 text-white font-bold text-lg rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Procesando…" : "Confirmar cobro"}
          </button>
        </div>
      </div>
    </div>
  );
}
