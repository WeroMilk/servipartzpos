"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DollarSign, Loader2, Check, Printer } from "lucide-react";
import {
  calculateShiftSummary,
  saveCashCount,
  type CashCount,
} from "@/lib/cashCountService";
import { getSalesByShift } from "@/lib/salesRegistry";
import { getShiftById, closeShift } from "@/lib/shiftService";
import { storeStore } from "@/lib/storeStore";
import { movementsService, notificationsService } from "@/lib/movements";
import { demoAuth } from "@/lib/demoAuth";
import { SERVIPARTZ_INFO } from "@/lib/storeInfo";
import type { PaymentMethod } from "@/lib/types";
import { ArqueoSummary, summaryToArqueoData } from "@/components/Turnos/ArqueoSummary";

const METHOD_LABELS: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  tarjeta_debito: "Tarjeta débito",
  tarjeta_credito: "Tarjeta crédito",
  transferencia: "Transferencia",
};

type ShiftSummary = ReturnType<typeof calculateShiftSummary>;

function buildCorteReportHtml(
  cut: CashCount,
  summary: ShiftSummary,
  storeName: string,
  sales: ReturnType<typeof getSalesByShift>
): string {
  const date = new Date(cut.closedAt);
  const dateStr = date.toLocaleString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const terminal = (summary.salesByMethod.tarjeta_debito ?? 0) + (summary.salesByMethod.tarjeta_credito ?? 0) + (summary.salesByMethod.tarjeta ?? 0);
  const transferencias = summary.salesByMethod.transferencia ?? 0;
  const salesRows = (Object.entries(cut.salesByMethod) as [PaymentMethod, number][])
    .filter(([, amt]) => amt > 0)
    .map(([m, amt]) => `<tr><td>${METHOD_LABELS[m]}</td><td style="text-align:right">$${amt.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td></tr>`)
    .join("");
  const diffClass = Math.abs(cut.difference) < 0.01 ? "color:green" : cut.difference > 0 ? "color:orange" : "color:red";
  const diffText = Math.abs(cut.difference) < 0.01 ? "Cuadra" : `${cut.difference > 0 ? "+" : ""}$${cut.difference.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

  let detailHtml = "";
  if (sales.length > 0) {
    const sortedSales = [...sales].sort((a, b) => a.ticketNumber - b.ticketNumber);
    const saleBlocks = sortedSales.map((sale) => {
      const itemRows = sale.items.map((item) => {
        const price = item.price ?? 0;
        const subtotal = price * item.quantity;
        return `<tr><td>${item.name}</td><td style="text-align:center">${item.quantity}</td><td style="text-align:right">$${price.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td><td style="text-align:right">$${subtotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td></tr>`;
      }).join("");
      const subtotal = sale.subtotalBeforeDiscount ?? sale.items.reduce((a, i) => a + (i.price ?? 0) * i.quantity, 0);
      const discount = sale.discountTotal ?? 0;
      const discountRow = discount > 0
        ? `<tr class="discount-row"><td colspan="3" style="text-align:right;color:#059669">Descuento</td><td style="text-align:right;color:#059669">-$${discount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td></tr>`
        : "";
      return `
        <tr><td colspan="4" class="sale-header">Ticket #${String(sale.ticketNumber).padStart(6, "0")}</td></tr>
        ${itemRows}
        <tr><td colspan="3" style="text-align:right">Subtotal</td><td style="text-align:right">$${subtotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td></tr>
        ${discountRow}
        <tr class="sale-total"><td colspan="3" style="text-align:right;font-weight:bold">Total venta</td><td style="text-align:right;font-weight:bold">$${sale.total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td></tr>
      `;
    }).join("");
    detailHtml = `
  <div class="section">
    <div class="section-title">Detalle de ventas</div>
    <table>
      <thead>
        <tr><th>Artículo</th><th style="text-align:center">Cant</th><th style="text-align:right">P. unit</th><th style="text-align:right">Subtotal</th></tr>
      </thead>
      <tbody>
        ${saleBlocks}
      </tbody>
    </table>
  </div>
`;
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Corte de caja - ${dateStr}</title>
  <style>
    @page { size: letter; margin: 1.5cm; }
    body { font-family: system-ui, sans-serif; font-size: 12pt; padding: 24px; max-width: 21cm; margin: 0 auto; }
    h1 { font-size: 18pt; margin-bottom: 4px; }
    .subtitle { color: #666; font-size: 11pt; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    th, td { padding: 6px 8px; text-align: left; border-bottom: 1px solid #ddd; }
    th { font-weight: 600; }
    .total-row { font-weight: bold; border-top: 2px solid #333; }
    .sale-header { font-weight: 600; background: #f3f4f6; padding-top: 12px; }
    .sale-total { border-top: 1px solid #333; }
    .discount-row { font-style: italic; }
    .section { margin-top: 20px; }
    .section-title { font-weight: 600; font-size: 13pt; margin-bottom: 8px; }
    footer { margin-top: 24px; font-size: 10pt; color: #666; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>${SERVIPARTZ_INFO.name}</h1>
  <p class="subtitle">${SERVIPARTZ_INFO.tagline}</p>
  <p><strong>${storeName}</strong></p>
  <p>Corte de caja - ${dateStr}</p>

  <div class="section">
    <div class="section-title">Arqueo - Cuenta esto</div>
    <table>
      <tr><td>Fondo inicial</td><td style="text-align:right">$${summary.initialCash.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td></tr>
      <tr><td>Terminal (tarjeta débito/crédito)</td><td style="text-align:right">$${terminal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td></tr>
      <tr><td>Transferencias</td><td style="text-align:right">$${transferencias.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td></tr>
      <tr class="total-row"><td>Efectivo esperado en caja</td><td style="text-align:right">$${cut.expectedCash.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td></tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Ventas por método de pago</div>
    <table>
      ${salesRows}
      <tr class="total-row"><td>Total ventas</td><td style="text-align:right">$${cut.totalSales.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td></tr>
    </table>
  </div>
${detailHtml}
  <div class="section">
    <div class="section-title">Conteo físico de efectivo</div>
    <table>
      <tr><td>Efectivo contado</td><td style="text-align:right">$${cut.actualCash.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td></tr>
      <tr class="total-row"><td>Diferencia</td><td style="text-align:right;${diffClass}">${diffText}</td></tr>
    </table>
  </div>

  <footer>
    <p>${SERVIPARTZ_INFO.address} · ${SERVIPARTZ_INFO.city}</p>
    <p>Tel: ${SERVIPARTZ_INFO.phone}</p>
  </footer>
</body>
</html>`;
}

function printCorteReport(cut: CashCount, summary: ShiftSummary) {
  const storeName = storeStore.getStoreName() ?? "Matriz";
  const sales = getSalesByShift(cut.shiftId);
  const html = buildCorteReportHtml(cut, summary, storeName, sales);
  const win = window.open("", "_blank");
  if (!win) {
    alert("Permite ventanas emergentes para imprimir el reporte");
    return;
  }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
    win.close();
  }, 250);
}

function CorteContent() {
  const searchParams = useSearchParams();
  const shiftId = searchParams.get("shiftId");

  const [actualCash, setActualCash] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<ReturnType<typeof calculateShiftSummary> | null>(null);
  const [error, setError] = useState("");
  const [cutSaved, setCutSaved] = useState(false);
  const [savedCut, setSavedCut] = useState<CashCount | null>(null);
  const [savedSummary, setSavedSummary] = useState<ShiftSummary | null>(null);

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
      const shift = getShiftById(shiftId);
      const cut = saveCashCount(shiftId, actual, summary);
      closeShift(shiftId);
      movementsService.add({
        type: "shift_close",
        bottleId: "_",
        bottleName: "Caja",
        newValue: actual,
        userName: demoAuth.getCurrentUser()?.name ?? shift?.employeeName ?? "Sistema",
        description: `Cierre de caja: turno de ${shift?.employeeName ?? "—"} - Efectivo contado $${actual.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,
      });
      notificationsService.incrementUnread();
      setSavedCut(cut);
      setSavedSummary(summary);
      setCutSaved(true);
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

  if (!summary && !cutSaved) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (cutSaved && savedCut && savedSummary) {
    return (
      <div className="h-full min-h-0 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 px-4 pt-2 pb-1">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary-600" />
            Corte de caja
          </h2>
          <p className="text-xs text-slate-500">Conteo de efectivo y cierre de turno</p>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col items-center justify-center gap-6">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center max-w-sm">
            <Check className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
            <h3 className="font-semibold text-emerald-800 mb-1">Turno cerrado correctamente</h3>
            <p className="text-sm text-emerald-700">El corte de caja se ha guardado.</p>
          </div>
          <div className="flex flex-col gap-3 w-full max-w-sm">
            <button
              type="button"
              onClick={() => printCorteReport(savedCut, savedSummary)}
              className="w-full py-4 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 flex items-center justify-center gap-2"
            >
              <Printer className="w-5 h-5" />
              Imprimir reporte (hoja carta)
            </button>
            <a
              href="/turnos"
              className="block text-center py-3 text-primary-600 font-medium hover:text-primary-700"
            >
              Volver a Turnos
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!summary) return null;

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

        <ArqueoSummary
          data={summaryToArqueoData(summary)}
          variant="corte"
        />

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Efectivo contado
          </label>
          <p className="text-xs text-slate-500 mb-2">
            Cuenta el efectivo en caja (fondo + cobros en efectivo - cambios dados) y escribe lo que contaste
          </p>
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
