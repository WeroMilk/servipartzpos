"use client";

import { useState, useEffect } from "react";
import { Download, Printer, TrendingUp, Calendar } from "lucide-react";
import {
  getSalesStats,
  getSalesStatsForPeriod,
  buildReportTextForPeriod,
  printReportForPeriod,
  type SalesStats,
  type ReportPeriod,
} from "@/lib/salesReport";

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function toMonthString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function ReportPage() {
  const today = new Date();
  const [stats, setStats] = useState<SalesStats | null>(null);
  const [downloadPeriod, setDownloadPeriod] = useState<ReportPeriod>("day");
  const [selectedDate, setSelectedDate] = useState<string>(() => toDateString(today));
  const [selectedMonth, setSelectedMonth] = useState<string>(() => toMonthString(today));

  const refDate =
    downloadPeriod === "month"
      ? (() => {
          const [y, m] = selectedMonth.split("-").map(Number);
          return new Date(y, m - 1, 1);
        })()
      : new Date(selectedDate + "T12:00:00");

  const periodStats = getSalesStatsForPeriod(downloadPeriod, refDate);

  useEffect(() => {
    setStats(getSalesStats());
  }, []);

  const handleDownload = () => {
    const text = buildReportTextForPeriod(downloadPeriod, periodStats);
    const dateStr = downloadPeriod === "month" ? selectedMonth : selectedDate;
    const name = `reporte-ventas-${downloadPeriod}-${dateStr}.txt`;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => printReportForPeriod(downloadPeriod, refDate);

  if (!stats) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="text-apple-text2 text-sm">Cargando…</span>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden">
      <div className="flex-shrink-0 px-4 pt-2 pb-1">
        <h2 className="text-lg font-semibold text-apple-text">Reporte de ventas</h2>
        <p className="text-xs text-apple-text2">Ventas del día, semana, mes y lo más vendido</p>
        <p className="text-[10px] text-apple-text2 mt-0.5">
          Selecciona día, semana o mes. Datos de los últimos 90 días.
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col p-4 gap-3 w-full" style={{ WebkitOverflowScrolling: "touch" }}>
        {/* Períodos: Hoy, Semana, Mes (ingresos en $) */}
        <div className="grid grid-cols-3 gap-2 flex-shrink-0">
          <div className="bg-apple-surface rounded-2xl border border-apple-border p-3 text-center">
            <p className="text-[10px] sm:text-xs text-apple-text2 uppercase tracking-wide">{stats.dayLabel}</p>
            <p className="text-lg sm:text-xl font-semibold text-apple-accent mt-0.5">
              ${stats.dayRevenue.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-apple-text2">ingresos</p>
          </div>
          <div className="bg-apple-surface rounded-2xl border border-apple-border p-3 text-center">
            <p className="text-[10px] sm:text-xs text-apple-text2 uppercase tracking-wide">{stats.weekLabel}</p>
            <p className="text-lg sm:text-xl font-semibold text-apple-accent mt-0.5">
              ${stats.weekRevenue.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-apple-text2">ingresos</p>
          </div>
          <div className="bg-apple-surface rounded-2xl border border-apple-border p-3 text-center">
            <p className="text-[10px] sm:text-xs text-apple-text2 uppercase tracking-wide">{stats.monthLabel}</p>
            <p className="text-lg sm:text-xl font-semibold text-apple-accent mt-0.5">
              ${stats.monthRevenue.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-apple-text2">ingresos</p>
          </div>
        </div>

        {/* Lo más vendido (del período seleccionado) */}
        <div className="flex-1 min-h-0 flex flex-col bg-apple-surface rounded-2xl border border-apple-border overflow-hidden flex-shrink-0">
          <div className="flex-shrink-0 flex items-center gap-2 p-3 border-b border-apple-border/50">
            <TrendingUp className="w-4 h-4 text-apple-accent flex-shrink-0" />
            <h3 className="font-semibold text-apple-text text-sm">Lo más vendido ({periodStats.label})</h3>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3" style={{ WebkitOverflowScrolling: "touch" }}>
            {periodStats.topProducts.length === 0 ? (
              <p className="text-xs text-apple-text2 text-center py-4">Sin ventas en este período</p>
            ) : (
              <ul className="space-y-1.5">
                {periodStats.topProducts.map((p, i) => (
                  <li
                    key={`${p.name}-${i}`}
                    className="flex items-center justify-between gap-2 text-xs py-1 border-b border-apple-border/40 last:border-0"
                  >
                    <span className="font-medium text-apple-text truncate">{p.name}</span>
                    <span className="text-apple-accent font-semibold shrink-0 text-right">
                      {p.quantity} {p.unit}
                      {p.revenue != null && (
                        <span className="text-apple-text2 font-normal ml-1">${p.revenue.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Detalle de ventas: producto, cantidad, precio, subtotal */}
        {(periodStats.detailLines.length > 0 || periodStats.totalRevenue > 0) && (
          <div className="flex-shrink-0 flex flex-col bg-apple-surface rounded-2xl border border-apple-border overflow-hidden">
            <div className="flex-shrink-0 p-3 border-b border-apple-border/50">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-semibold text-apple-text text-sm">Detalle de ventas ({periodStats.label})</h3>
                {periodStats.totalRevenue > 0 && (
                  <span className="text-sm font-semibold text-apple-accent shrink-0">
                    ${periodStats.totalRevenue.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-apple-text2 mt-0.5">Producto, cantidad, precio unitario y subtotal</p>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto max-h-48 p-3" style={{ WebkitOverflowScrolling: "touch" }}>
              {periodStats.detailLines.length > 0 ? (
                <ul className="space-y-2 text-xs">
                  {periodStats.detailLines.map((d, i) => (
                    <li key={`${d.name}-${i}`} className="border-b border-apple-border/40 pb-2 last:border-0 last:pb-0">
                      <p className="font-medium text-apple-text">{d.name}</p>
                      <p className="text-apple-text2 mt-0.5">
                        {d.quantity} × ${d.price.toFixed(2)} = <span className="font-semibold text-apple-accent">${d.subtotal.toFixed(2)}</span>
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-apple-text2">Sin detalle por producto en este período</p>
              )}
            </div>
          </div>
        )}

        {/* Descargar / Imprimir reporte: elegir período y fecha */}
        <div className="flex-shrink-0 space-y-2">
          <p className="text-xs font-medium text-apple-text2">Reporte por</p>
          <div className="flex gap-2">
            {(["day", "week", "month"] as const).map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => setDownloadPeriod(period)}
                className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-colors ${
                  downloadPeriod === period
                    ? "bg-apple-accent text-white"
                    : "bg-apple-surface border border-apple-border text-apple-text2 hover:bg-apple-bg"
                }`}
              >
                {period === "day" ? "Día" : period === "week" ? "Semana" : "Mes"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-apple-text2 flex-shrink-0" />
            {downloadPeriod === "month" ? (
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                max={toMonthString(today)}
                className="flex-1 px-3 py-2.5 text-sm bg-apple-surface border border-apple-border rounded-xl text-apple-text focus:outline-none focus:ring-2 focus:ring-apple-accent"
              />
            ) : (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={toDateString(today)}
                className="flex-1 px-3 py-2.5 text-sm bg-apple-surface border border-apple-border rounded-xl text-apple-text focus:outline-none focus:ring-2 focus:ring-apple-accent"
              />
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-apple-accent text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
            >
              <Download className="w-4 h-4 flex-shrink-0" />
              Descargar
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-apple-surface border border-apple-border text-apple-text text-sm font-medium rounded-xl hover:bg-apple-bg transition-colors"
            >
              <Printer className="w-4 h-4 flex-shrink-0" />
              Imprimir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
