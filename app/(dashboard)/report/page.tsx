"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Download, Printer, TrendingUp, Clock, ChevronDown } from "lucide-react";
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
import { CalendarPicker } from "@/components/Report/CalendarPicker";
import { useFirebase } from "@/lib/firebase";
import { useSalesByStore } from "@/lib/hooks/useSales";
import type { Sale } from "@/lib/types";

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function toMonthString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatPeriodLabelShort(period: ReportPeriod, refDate: Date): string {
  if (period === "day") {
    return refDate.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
  }
  if (period === "week") {
    const start = new Date(refDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${start.getDate()}-${end.getDate()} ${start.toLocaleDateString("es-MX", { month: "short" })}`;
  }
  return refDate.toLocaleDateString("es-MX", { month: "long", year: "numeric" }).replace(/^\w/, (c) => c.toUpperCase());
}

export default function ReportPage() {
  const isLimited = demoAuth.isLimitedUser();
  const storeId = typeof window !== "undefined" ? storeStore.getStoreId() : null;
  const currentShift = storeId ? getCurrentShift(storeId) : null;
  const shiftStats = currentShift ? getSalesStatsForShift(currentShift.id) : null;
  const isCloud = !!storeId && storeId !== "default" && useFirebase;

  // Hook para escuchar ventas en tiempo real
  const { sales, loading: salesLoading } = useSalesByStore(isCloud ? storeId : null);

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const [stats, setStats] = useState<SalesStats | null>(null);
  const [period, setPeriod] = useState<ReportPeriod>("day");
  const [refDate, setRefDate] = useState<Date>(() => new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);

  const periodStats = getSalesStatsForPeriod(period, refDate);

  const computeCloudPeriodStats = (salesList: Sale[], p: ReportPeriod, ref: Date) => {
    const start = new Date(ref);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    if (p === "day") {
      end.setHours(23, 59, 59, 999);
    } else if (p === "week") {
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else {
      start.setDate(1);
      end.setMonth(start.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
    }

    const filtered = salesList.filter((s) => s.timestamp >= start && s.timestamp <= end);
    const totalRevenue = filtered.reduce((acc, s) => acc + (s.total ?? 0), 0);
    let total = 0;
    const byProduct: Record<string, { quantity: number; revenue: number }> = {};
    const detailLines: { name: string; quantity: number; price: number; subtotal: number }[] = [];
    for (const sale of filtered) {
      for (const item of sale.items ?? []) {
        const key = item.name;
        const price = item.price ?? 0;
        const subtotal = price * item.quantity;
        total += item.quantity;
        if (!byProduct[key]) byProduct[key] = { quantity: 0, revenue: 0 };
        byProduct[key].quantity += item.quantity;
        byProduct[key].revenue += subtotal;
        if (price > 0) detailLines.push({ name: item.name, quantity: item.quantity, price, subtotal });
      }
    }
    const topProducts = Object.entries(byProduct)
      .map(([name, v]) => ({ name, quantity: v.quantity, unit: "unid", revenue: v.revenue > 0 ? v.revenue : undefined }))
      .sort((a, b) => (b.revenue ?? 0) - (a.revenue ?? 0))
      .slice(0, 10);
    const label =
      p === "day"
        ? ref.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" })
        : p === "week"
          ? `${start.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit" })} - ${end.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" })}`
          : ref.toLocaleDateString("es-MX", { month: "long", year: "numeric" }).replace(/^\w/, (c) => c.toUpperCase());

    return { total, totalRevenue, label, topProducts, detailLines };
  };

  useEffect(() => {
    setStats(getSalesStats());
  }, []);

  const handleDownload = () => {
    const effectiveForDownload = isCloud && !salesLoading && sales.length > 0
      ? (() => {
          const s = computeCloudPeriodStats(sales, period, refDate);
          return {
            total: s.total,
            totalRevenue: s.totalRevenue,
            label: s.label,
            topProducts: s.topProducts,
            detailLines: s.detailLines,
          } as any;
        })()
      : periodStats;
    const text = buildReportTextForPeriod(period, effectiveForDownload);
    const dateStr = period === "month" ? toMonthString(refDate) : toDateString(refDate);
    const name = `reporte-ventas-${period}-${dateStr}.txt`;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => printReportForPeriod(period, refDate);

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

  if ((isCloud && salesLoading) || (!isCloud && !stats)) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="text-apple-text2 text-sm">Cargando…</span>
      </div>
    );
  }

  const effectivePeriodStats = isCloud && !salesLoading && sales.length > 0
    ? computeCloudPeriodStats(sales, period, refDate)
    : periodStats;

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden">
      <div className="flex-shrink-0 px-4 pt-2 pb-1">
        <h2 className="text-lg font-semibold text-apple-text">Reporte de ventas</h2>
        <p className="text-xs text-apple-text2">Ventas del día, semana, mes y lo más vendido</p>
        <p className="text-[10px] text-apple-text2 mt-0.5">
          Selecciona día, semana o mes. Datos de los últimos 90 días.
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col p-4 gap-3 w-full overflow-touch">
        {/* Selectores de período: Día, Semana, Mes - clickeables, abren calendario */}
        <div className="grid grid-cols-3 gap-2 flex-shrink-0">
          {(["day", "week", "month"] as const).map((p) => {
            const isActive = period === p;
            const refForLabel = p === "month" ? new Date(refDate.getFullYear(), refDate.getMonth(), 1) : refDate;
            const label = formatPeriodLabelShort(p, refForLabel);
            const statsForBox = isCloud && !salesLoading && sales.length > 0
              ? computeCloudPeriodStats(sales, p, refForLabel)
              : getSalesStatsForPeriod(p, refForLabel);
            const revenue = (statsForBox as any).totalRevenue;
            return (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setPeriod(p);
                  setCalendarOpen(true);
                }}
                className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-200 min-h-[72px] text-left w-full ${
                  isActive
                    ? "border-apple-accent bg-gradient-to-br from-apple-accent/10 to-primary-100/50 shadow-lg shadow-apple-accent/10"
                    : "border-apple-border bg-apple-surface hover:border-apple-accent/50 hover:bg-apple-bg"
                }`}
              >
                <p className="text-[10px] sm:text-xs text-apple-text2 uppercase tracking-wide font-medium">
                  {p === "day" ? "Día" : p === "week" ? "Semana" : "Mes"}
                </p>
                <p className="text-xs sm:text-sm text-apple-text font-medium mt-0.5 truncate w-full text-center" title={label}>
                  {label}
                </p>
                <p className="text-base sm:text-lg font-bold text-apple-accent mt-0.5">
                  ${revenue.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[10px] text-apple-text2">ingresos</p>
                <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-apple-text2 transition-transform ${isActive ? "rotate-180" : ""}`} />
              </button>
            );
          })}
        </div>

        <CalendarPicker
          period={period}
          value={period === "month" ? new Date(refDate.getFullYear(), refDate.getMonth(), 1) : refDate}
          maxDate={today}
          onSelect={(d) => {
            setRefDate(period === "month" ? new Date(d.getFullYear(), d.getMonth(), 1) : d);
            setCalendarOpen(false);
          }}
          onClose={() => setCalendarOpen(false)}
          isOpen={calendarOpen}
        />

        {/* Lo más vendido (del período seleccionado) */}
        <div className="flex-1 min-h-0 flex flex-col bg-apple-surface rounded-2xl border border-apple-border overflow-hidden flex-shrink-0">
          <div className="flex-shrink-0 flex items-center gap-2 p-3 border-b border-apple-border/50">
            <TrendingUp className="w-4 h-4 text-apple-accent flex-shrink-0" />
            <h3 className="font-semibold text-apple-text text-sm">Lo más vendido ({effectivePeriodStats.label})</h3>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 overflow-touch">
            {effectivePeriodStats.topProducts.length === 0 ? (
              <p className="text-xs text-apple-text2 text-center py-4">Sin ventas en este período</p>
            ) : (
              <ul className="space-y-1.5">
                {effectivePeriodStats.topProducts.map((p, i) => (
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
        {((effectivePeriodStats as any).detailLines?.length > 0 || (effectivePeriodStats as any).totalRevenue > 0) && (
          <div className="flex-shrink-0 flex flex-col bg-apple-surface rounded-2xl border border-apple-border overflow-hidden">
            <div className="flex-shrink-0 p-3 border-b border-apple-border/50">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-semibold text-apple-text text-sm">Detalle de ventas ({effectivePeriodStats.label})</h3>
                {(effectivePeriodStats as any).totalRevenue > 0 && (
                  <span className="text-sm font-semibold text-apple-accent shrink-0">
                    ${(effectivePeriodStats as any).totalRevenue.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-apple-text2 mt-0.5">Producto, cantidad, precio unitario y subtotal</p>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto max-h-48 p-3 overflow-touch">
              {((effectivePeriodStats as any).detailLines?.length ?? 0) > 0 ? (
                <ul className="space-y-2 text-xs">
                  {(effectivePeriodStats as any).detailLines.map((d: any, i: number) => (
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

        {/* Descargar / Imprimir reporte del período seleccionado */}
        <div className="flex-shrink-0 space-y-2">
          <p className="text-xs font-medium text-apple-text2">
            Reporte: {periodStats.label}
          </p>
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
