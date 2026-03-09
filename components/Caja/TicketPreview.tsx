"use client";

import { Printer, ShoppingCart } from "lucide-react";
import { printTicket, type TicketData } from "@/lib/ticketService";

interface TicketPreviewProps {
  data: TicketData;
  onNewSale: () => void;
}

export default function TicketPreview({ data, onNewSale }: TicketPreviewProps) {
  const handlePrint = () => printTicket(data);

  const date = data.date ?? new Date();
  const dateStr = date.toLocaleString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const ticketNum = String(data.ticketNumber).padStart(6, "0");
  const paymentLabel =
    data.paymentMethod === "tarjeta_debito"
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
            <div className="border-t border-slate-200 mt-2 pt-2 font-semibold">
              Total: ${data.total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-slate-500 mt-1">
              {dateStr} · {paymentLabel}
              {data.change != null && data.change > 0 && ` · Cambio: $${data.change.toFixed(2)}`}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 flex gap-2">
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
            onClick={onNewSale}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700"
          >
            <ShoppingCart className="w-5 h-5" />
            Nueva venta
          </button>
        </div>
      </div>
    </div>
  );
}
