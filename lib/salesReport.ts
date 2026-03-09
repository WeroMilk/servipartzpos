/**
 * Historial de ventas para reportes: día, semana, mes y lo que más se vende.
 * Se alimenta desde la Caja al registrar ventas.
 */

const SALES_HISTORY_KEY = "mibarra-sales-history";
const MAX_DAYS = 90;

export interface SalesHistoryEntry {
  timestamp: string; // ISO
  bottleName: string;
  quantity: number;
  unit: "oz" | "units";
}

function getHistory(): SalesHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SALES_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SalesHistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: SalesHistoryEntry[]) {
  try {
    localStorage.setItem(SALES_HISTORY_KEY, JSON.stringify(entries));
  } catch {
    // ignore
  }
}

/** Llamar desde Caja al registrar una venta */
export function addSalesFromImport(
  applied: { bottleName: string; deducted: number; unit: "oz" | "units" }[],
  timestamp: Date
) {
  const iso = timestamp.toISOString();
  const history = getHistory();
  const cut = new Date();
  cut.setDate(cut.getDate() - MAX_DAYS);
  const filtered = history.filter((e) => new Date(e.timestamp) >= cut);
  const newEntries: SalesHistoryEntry[] = applied.map((a) => ({
    timestamp: iso,
    bottleName: a.bottleName,
    quantity: a.deducted,
    unit: a.unit,
  }));
  saveHistory([...newEntries, ...filtered]);
}

function isToday(d: Date): boolean {
  const t = new Date();
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
}

function isThisWeek(d: Date): boolean {
  const t = new Date();
  const start = new Date(t);
  start.setDate(t.getDate() - t.getDay());
  start.setHours(0, 0, 0, 0);
  return d >= start;
}

function isThisMonth(d: Date): boolean {
  const t = new Date();
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth();
}

export interface SalesStats {
  dayTotal: number;
  weekTotal: number;
  monthTotal: number;
  dayLabel: string;
  weekLabel: string;
  monthLabel: string;
  topProducts: { name: string; quantity: number; unit: string }[];
}

export function getSalesStats(): SalesStats {
  const history = getHistory();
  const entries = history.map((e) => ({ ...e, date: new Date(e.timestamp) }));

  let dayTotal = 0;
  let weekTotal = 0;
  let monthTotal = 0;
  const byProduct: Record<string, { quantity: number; unit: string }> = {};

  for (const e of entries) {
    const q = e.quantity;
    const u = e.unit === "units" ? "unid" : "oz";
    if (isToday(e.date)) dayTotal += q;
    if (isThisWeek(e.date)) weekTotal += q;
    if (isThisMonth(e.date)) monthTotal += q;

    const key = e.bottleName;
    if (!byProduct[key]) byProduct[key] = { quantity: 0, unit: u };
    byProduct[key].quantity += q;
  }

  const topProducts = Object.entries(byProduct)
    .map(([name, { quantity, unit }]) => ({ name, quantity, unit }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  return {
    dayTotal,
    weekTotal,
    monthTotal,
    dayLabel: "Hoy",
    weekLabel: "Semana",
    monthLabel: "Mes",
    topProducts,
  };
}

export type ReportPeriod = "day" | "week" | "month";

export interface SalesStatsForPeriod {
  total: number;
  label: string;
  topProducts: { name: string; quantity: number; unit: string }[];
}

function filterByPeriod(entries: { date: Date; quantity: number; bottleName: string; unit: string }[], period: ReportPeriod) {
  if (period === "day") return entries.filter((e) => isToday(e.date));
  if (period === "week") return entries.filter((e) => isThisWeek(e.date));
  return entries.filter((e) => isThisMonth(e.date));
}

export function getSalesStatsForPeriod(period: ReportPeriod): SalesStatsForPeriod {
  const history = getHistory();
  const entries = history.map((e) => ({
    date: new Date(e.timestamp),
    quantity: e.quantity,
    bottleName: e.bottleName,
    unit: e.unit === "units" ? "unid" : "oz",
  }));
  const filtered = filterByPeriod(entries, period);
  let total = 0;
  const byProduct: Record<string, { quantity: number; unit: string }> = {};
  for (const e of filtered) {
    total += e.quantity;
    if (!byProduct[e.bottleName]) byProduct[e.bottleName] = { quantity: 0, unit: e.unit };
    byProduct[e.bottleName].quantity += e.quantity;
  }
  const topProducts = Object.entries(byProduct)
    .map(([name, { quantity, unit }]) => ({ name, quantity, unit }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);
  const labels: Record<ReportPeriod, string> = { day: "Día (hoy)", week: "Semana", month: "Mes" };
  return { total, label: labels[period], topProducts };
}

/** Genera texto para descargar como .txt (resumen de todos los períodos) */
export function buildReportText(stats: SalesStats): string {
  const lines: string[] = [
    "Reporte de ventas - Servipartz",
    `Generado: ${new Date().toLocaleString("es-ES")}`,
    "",
    "Ventas por período",
    "-------------------",
    `${stats.dayLabel}: ${stats.dayTotal.toFixed(1)}`,
    `${stats.weekLabel}: ${stats.weekTotal.toFixed(1)}`,
    `${stats.monthLabel}: ${stats.monthTotal.toFixed(1)}`,
    "",
    "Lo más vendido",
    "--------------",
    ...stats.topProducts.map((p, i) => `${i + 1}. ${p.name}: ${p.quantity.toFixed(1)} ${p.unit}`),
    "",
    "--- Servipartz ---",
  ];
  return lines.join("\n");
}

/** Genera texto del reporte para un período concreto (día, semana o mes) */
export function buildReportTextForPeriod(period: ReportPeriod, periodStats: SalesStatsForPeriod): string {
  const lines: string[] = [
    `Reporte de ventas por ${periodStats.label} - Servipartz`,
    `Generado: ${new Date().toLocaleString("es-ES")}`,
    "",
    "Total ventas",
    "------------",
    `${periodStats.label}: ${periodStats.total.toFixed(1)}`,
    "",
    "Lo más vendido en el período",
    "-----------------------------",
    ...(periodStats.topProducts.length === 0
      ? ["Sin datos"]
      : periodStats.topProducts.map((p, i) => `${i + 1}. ${p.name}: ${p.quantity.toFixed(1)} ${p.unit}`)),
    "",
    "--- Servipartz ---",
  ];
  return lines.join("\n");
}
