"use client";

import { useState } from "react";
import { Printer, ShoppingCart, FileText, Loader2 } from "lucide-react";
import { printTicket, type TicketData } from "@/lib/ticketService";
import { generateCFDI } from "@/lib/cfdiService";

interface TicketPreviewProps {
  data: TicketData;
  onNewSale: () => void;
}

export default function TicketPreview({ data, onNewSale }: TicketPreviewProps) {
  const [cfdiLoading, setCfdiLoading] = useState(false);
  const [cfdiError, setCfdiError] = useState<string | null>(null);

  const handlePrint = () => printTicket(data);

  const handleGenerarCFDI = async () => {
    setCfdiLoading(true);
    setCfdiError(null);
    try {
      const result = await generateCFDI(
        data.items,
        data.total,
        data.ticketNumber,
        data.date ?? new Date()
      );
      if (result.success) {
        if (result.pdfUrl) window.open(result.pdfUrl, "_blank");
        else if (result.uuid) alert(`CFDI generado. UUID: ${result.uuid}`);
      } else {
        setCfdiError(result.error ?? "Error al generar CFDI");
      }
    } catch (e) {
      setCfdiError(e instanceof Error ? e.message : "Error al generar CFDI");
    } finally {
      setCfdiLoading(false);
    }
  };

  const date = data.date ?? new Date();
  const dateStr = date.toLocaleString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const ticketNum = String(data.ticketNumber).padStart(6, "0");
  const paymentLabel = data.payments?.length
    ? data.payments
        .map((p) =>
          p.method === "tarjeta_debito"
            ? `Tarjeta débito $${p.amount.toFixed(2)}`
            : p.method === "tarjeta_credito"
              ? `Tarjeta crédito $${p.amount.toFixed(2)}`
              : `${p.method.charAt(0).toUpperCase() + p.method.slice(1)} $${p.amount.toFixed(2)}`
        )
        .join(", ")
    : data.paymentMethod === "tarjeta_debito"
      ? "Tarjeta débito"
      : data.paymentMethod === "tarjeta_credito"
        ? "Tarjeta crédito"
        : data.paymentMethod
          ? data.paymentMethod.charAt(0).toUpperCase() + data.paymentMethod.slice(1)
          : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden">
        <div className="bg-emerald-600 px-4 py-3 text-center">
          <h3 className="text-lg font-bold text-white">Venta completada</h3>
          <p className="text-emerald-100 text-sm">Ticket #{ticketNum}</p>
        </div>

        <div className="p-4 max-h-[50vh] overflow-y-auto">
          <div className="bg-slate-50 rounded-xl p-4 font-mono text-xs whitespace-pre-wrap">
            {data.items.map((item) => {
              const price = item.price ?? 0;
              const subtotal = price * item.quantity;
              return (
                <div key={`${item.productId}-${item.name}`} className="flex justify-between py-0.5">
                  <span className="truncate flex-1 mr-2">{item.name}</span>
                  <span className="shrink-0">
                    {item.quantity} × ${price.toFixed(2)} = ${subtotal.toFixed(2)}
                  </span>
                </div>
              );
            })}
            {data.subtotalBeforeDiscount != null && data.discountTotal != null && data.discountTotal > 0 && (
              <>
                <div className="border-t border-slate-200 mt-2 pt-2 flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>${data.subtotalBeforeDiscount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-emerald-600">
                  <span>Descuento</span>
                  <span>-${data.discountTotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                </div>
              </>
            )}
            <div className="border-t border-slate-200 mt-2 pt-2 font-semibold">
              Total: ${data.total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-slate-500 mt-1">
              {dateStr} · {paymentLabel}
              {data.change != null && data.change > 0 && ` · Cambio: $${data.change.toFixed(2)}`}
            </div>
          </div>
        </div>

        {cfdiError && (
          <div className="px-4 py-2 bg-amber-50 border-t border-amber-200 text-amber-800 text-xs">
            {cfdiError}
          </div>
        )}
        <div className="p-4 border-t border-slate-200 flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-800 text-white font-semibold rounded-xl hover:bg-slate-900"
            >
              <Printer className="w-5 h-5" />
              Imprimir ticket
            </button>
            <button
              type="button"
              onClick={handleGenerarCFDI}
              disabled={cfdiLoading}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50"
            >
              {cfdiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
              Generar CFDI
            </button>
          </div>
          <button
            type="button"
            onClick={onNewSale}
            className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700"
          >
            <ShoppingCart className="w-5 h-5" />
            Nueva venta
          </button>
        </div>
      </div>
    </div>
  );
}
