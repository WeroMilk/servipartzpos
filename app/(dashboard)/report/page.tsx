"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Download, Printer, TrendingUp, Calendar, Clock } from "lucide-react";
import {
  getSalesStats,
  getSalesStatsForPeriod,
  getSalesStatsForShift,
  buildReportTextForPeriod,
  buildReportTextForShift,
  printReportForPeriod,
  printReportForShift,
  type SalesStats,
  type ReportPeriod,
} from "@/lib/salesReport";
import { demoAuth } from "@/lib/demoAuth";
import { storeStore } from "@/lib/storeStore";
import { getCurrentShift } from "@/lib/shiftService";

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function toMonthString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Devuelve el domingo de la semana que contiene d */
function getWeekStart(d: Date): Date {
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay());
  start.setHours(0, 0, 0, 0);
  return start;
}

/** Lista de semanas para los últimos 90 días. Cada item: { value: "YYYY-MM-DD" (domingo), label: "2 al 8 de marzo 2026" } */
function getWeekOptions(): { value: string; label: string }[] {
  const today = new Date();
  const weeks: { value: string; label: string }[] = [];
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - 90);

  let weekStart = getWeekStart(today);
  while (weekStart >= cutoff) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const value = toDateString(weekStart);
    const monthYear = weekEnd.toLocaleDateString("es-MX", { month: "long", year: "numeric" }).replace(/^\w/, (c) => c.toUpperCase());
    const label =
      weekStart.getMonth() === weekEnd.getMonth()
        ? `${weekStart.getDate()} al ${weekEnd.getDate()} de ${monthYear}`
        : `${weekStart.getDate()} ${weekStart.toLocaleDateString("es-MX", { month: "short" })} - ${weekEnd.getDate()} ${weekEnd.toLocaleDateString("es-MX", { month: "short", year: "numeric" })}`;
    weeks.push({ value, label });
    weekStart.setDate(weekStart.getDate() - 7);
  }
  return weeks;
}

export default function ReportPage() {
  const isLimited = demoAuth.isLimitedUser();
  const storeId = typeof window !== "undefined" ? storeStore.getStoreId() : null;
  const currentShift = storeId ? getCurrentShift(storeId) : null;
  const shiftStats = currentShift ? getSalesStatsForShift(currentShift.id) : null;

  const today = new Date();
  const weekOptions = getWeekOptions();
  const defaultWeek = weekOptions[0]?.value ?? toDateString(getWeekStart(today));

  const [stats, setStats] = useState<SalesStats | null>(null);
  const [downloadPeriod, setDownloadPeriod] = useState<ReportPeriod>("day");
  const [selectedDate, setSelectedDate] = useState<string>(() => toDateString(today));
  const [selectedWeek, setSelectedWeek] = useState<string>(() => defaultWeek);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => toMonthString(today));

  const refDate =
    downloadPeriod === "month"
      ? (() => {
          const [y, m] = selectedMonth.split("-").map(Number);
          return new Date(y, m - 1, 1);
        })()
      : downloadPeriod === "week"
        ? new Date(selectedWeek + "T12:00:00")
        : new Date(selectedDate + "T12:00:00");

  const periodStats = getSalesStatsForPeriod(downloadPeriod, refDate);

  useEffect(() => {
    setStats(getSalesStats());
  }, []);

  const handleDownload = () => {
    const text = buildReportTextForPeriod(downloadPeriod, periodStats);
    const dateStr = downloadPeriod === "month" ? selectedMonth : downloadPeriod === "week" ? selectedWeek : selectedDate;
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

  // Usuario limitado (Gabriel): solo reporte de turno actual
  if (isLimited) {
    if (!currentShift) {
      return (
        <div className="h-full flex flex-col items-center justify-center p-4 gap-4">
          <Clock className="w-12 h-12 text-slate-300" />
          <p className="text-apple-text2 text-sm text-center">Abre un turno para ver el reporte de ventas de tu turno actual.</p>
          <Link href="/turnos" className="px-4 py-2 bg-apple-accent text-white text-sm font-medium rounded-xl hover:opacity-90">
            Ir a Turnos
          </Link>
        </div>
      );
    }
    const ps = shiftStats!;
    return (
      <div className="h-full min-h-0 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 px-4 pt-2 pb-1">
          <h2 className="text-lg font-semibold text-apple-text">Reporte de ventas</h2>
          <p className="text-xs text-apple-text2">Ventas de tu turno actual</p>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto p-4 gap-3 flex flex-col">
          <div className="bg-apple-surface rounded-2xl border border-apple-border p-4 text-center">
            <p className="text-xs text-apple-text2 uppercase">Total del turno</p>
            <p className="text-2xl font-bold text-apple-accent mt-1">
              ${ps.totalRevenue.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="flex-1 min-h-0 flex flex-col bg-apple-surface rounded-2xl border border-apple-border overflow-hidden">
            <div className="flex-shrink-0 flex items-center gap-2 p-3 border-b border-apple-border/50">
              <TrendingUp className="w-4 h-4 text-apple-accent" />
              <h3 className="font-semibold text-apple-text text-sm">Lo más vendido</h3>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-3">
              {ps.topProducts.length === 0 ? (
                <p className="text-xs text-apple-text2 text-center py-4">Sin ventas en este turno</p>
              ) : (
                <ul className="space-y-1.5">
                  {ps.topProducts.map((p, i) => (
                    <li key={`${p.name}-${i}`} className="flex justify-between gap-2 text-xs py-1 border-b border-apple-border/40 last:border-0">
                      <span className="font-medium text-apple-text truncate">{p.name}</span>
                      <span className="text-apple-accent font-semibold shrink-0">
                        {p.quantity} {p.unit}
                        {p.revenue != null && <span className="text-apple-text2 font-normal ml-1">${p.revenue.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          {ps.detailLines.length > 0 && (
            <div className="flex flex-col bg-apple-surface rounded-2xl border border-apple-border overflow-hidden max-h-48">
              <div className="p-3 border-b border-apple-border/50">
                <h3 className="font-semibold text-apple-text text-sm">Detalle de ventas</h3>
              </div>
              <div className="overflow-y-auto p-3">
                <ul className="space-y-2 text-xs">
                  {ps.detailLines.map((d, i) => (
                    <li key={`${d.name}-${i}`} className="border-b border-apple-border/40 pb-2 last:border-0">
                      <p className="font-medium text-apple-text">{d.name}</p>
                      <p className="text-apple-text2 mt-0.5">{d.quantity} × ${d.price.toFixed(2)} = <span className="font-semibold text-apple-accent">${d.subtotal.toFixed(2)}</span></p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                const text = buildReportTextForShift(ps);
                const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `reporte-turno-${new Date().toISOString().slice(0, 10)}.txt`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-apple-accent text-white text-sm font-medium rounded-xl hover:opacity-90"
            >
              <Download className="w-4 h-4" />
              Descargar
            </button>
            <button
              type="button"
              onClick={() => printReportForShift(currentShift.id)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-apple-surface border border-apple-border text-apple-text text-sm font-medium rounded-xl hover:bg-apple-bg"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            ) : downloadPeriod === "week" ? (
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="flex-1 px-3 py-2.5 text-sm bg-apple-surface border border-apple-border rounded-xl text-apple-text focus:outline-none focus:ring-2 focus:ring-apple-accent"
              >
                {weekOptions.map((w) => (
                  <option key={w.value} value={w.value}>
                    {w.label}
                  </option>
                ))}
              </select>
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
