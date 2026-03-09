/**
 * Historial de ventas para reportes: día, semana, mes y detalle de lo vendido con precios.
 * Se alimenta desde la Caja al registrar ventas.
 */

import { getSalesByShift } from "./salesRegistry";

const SALES_HISTORY_KEY = "mibarra-sales-history";
const MAX_DAYS = 90;

export interface SalesHistoryEntry {
  timestamp: string; // ISO
  bottleName: string;
  quantity: number;
  unit: "oz" | "units";
  /** Precio unitario (para reportes detallados) */
  price?: number;
  /** Subtotal de la línea (cantidad × precio) */
  subtotal?: number;
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

/** Historial de ventas para exportación (modo demo/localStorage) */
export function getSalesHistoryForExport(): SalesHistoryEntry[] {
  return getHistory();
}

function saveHistory(entries: SalesHistoryEntry[]) {
  try {
    localStorage.setItem(SALES_HISTORY_KEY, JSON.stringify(entries));
  } catch {
    // ignore
  }
}

/** Ítem de venta para registrar (desde Caja) */
export interface SaleItemForReport {
  name: string;
  quantity: number;
  price?: number;
}

/** Llamar desde Caja al registrar una venta. Guarda detalle con precios.
 * Si totalPaid < subtotal (por descuento), escala los subtotales proporcionalmente. */
export function addSalesFromImport(
  items: SaleItemForReport[],
  timestamp: Date,
  totalPaid?: number
) {
  const iso = timestamp.toISOString();
  const history = getHistory();
  const cut = new Date();
  cut.setDate(cut.getDate() - MAX_DAYS);
  const filtered = history.filter((e) => new Date(e.timestamp) >= cut);
  const subtotalSum = items.reduce((acc, item) => acc + (item.price ?? 0) * item.quantity, 0);
  const scale = totalPaid != null && subtotalSum > 0 ? totalPaid / subtotalSum : 1;
  const newEntries: SalesHistoryEntry[] = items.map((item) => {
    const price = item.price ?? 0;
    const subtotal = (item.quantity * price) * scale;
    return {
      timestamp: iso,
      bottleName: item.name,
      quantity: item.quantity,
      unit: "units" as const,
      price: price > 0 ? price : undefined,
      subtotal: subtotal > 0 ? subtotal : undefined,
    };
  });
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

/** Devuelve si d está en el mismo día que ref */
function isSameDay(d: Date, ref: Date): boolean {
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth() && d.getDate() === ref.getDate();
}

/** Devuelve si d está en la misma semana que ref (domingo a sábado) */
function isSameWeek(d: Date, ref: Date): boolean {
  const start = new Date(ref);
  start.setDate(ref.getDate() - ref.getDay());
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return d >= start && d <= end;
}

/** Devuelve si d está en el mismo mes que ref */
function isSameMonth(d: Date, ref: Date): boolean {
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

export interface SalesStats {
  dayTotal: number;
  weekTotal: number;
  monthTotal: number;
  dayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  dayLabel: string;
  weekLabel: string;
  monthLabel: string;
  topProducts: { name: string; quantity: number; unit: string; revenue?: number }[];
}

export function getSalesStats(): SalesStats {
  const history = getHistory();
  const entries = history.map((e) => ({ ...e, date: new Date(e.timestamp) }));

  let dayTotal = 0;
  let weekTotal = 0;
  let monthTotal = 0;
  let dayRevenue = 0;
  let weekRevenue = 0;
  let monthRevenue = 0;
  const byProduct: Record<string, { quantity: number; unit: string; revenue: number }> = {};

  for (const e of entries) {
    const q = e.quantity;
    const u = e.unit === "units" ? "unid" : "oz";
    const rev = e.subtotal ?? 0;
    if (isToday(e.date)) {
      dayTotal += q;
      dayRevenue += rev;
    }
    if (isThisWeek(e.date)) {
      weekTotal += q;
      weekRevenue += rev;
    }
    if (isThisMonth(e.date)) {
      monthTotal += q;
      monthRevenue += rev;
    }

    const key = e.bottleName;
    if (!byProduct[key]) byProduct[key] = { quantity: 0, unit: u, revenue: 0 };
    byProduct[key].quantity += q;
    byProduct[key].revenue += rev;
  }

  const topProducts = Object.entries(byProduct)
    .map(([name, { quantity, unit, revenue }]) => ({ name, quantity, unit, revenue: revenue > 0 ? revenue : undefined }))
    .sort((a, b) => (b.revenue ?? 0) - (a.revenue ?? 0) || b.quantity - a.quantity)
    .slice(0, 5);

  return {
    dayTotal,
    weekTotal,
    monthTotal,
    dayRevenue,
    weekRevenue,
    monthRevenue,
    dayLabel: "Hoy",
    weekLabel: "Semana",
    monthLabel: "Mes",
    topProducts,
  };
}

export type ReportPeriod = "day" | "week" | "month";

export interface DetailLine {
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface SalesStatsForPeriod {
  total: number;
  totalRevenue: number;
  label: string;
  topProducts: { name: string; quantity: number; unit: string; revenue?: number }[];
  /** Líneas detalladas: producto, cantidad, precio, subtotal (ordenadas por fecha más reciente) */
  detailLines: DetailLine[];
}

function filterByPeriod<T extends { date: Date }>(
  entries: T[],
  period: ReportPeriod,
  referenceDate?: Date
): T[] {
  const ref = referenceDate ?? new Date();
  if (period === "day") return entries.filter((e) => isSameDay(e.date, ref));
  if (period === "week") return entries.filter((e) => isSameWeek(e.date, ref));
  return entries.filter((e) => isSameMonth(e.date, ref));
}

function formatPeriodLabel(period: ReportPeriod, referenceDate: Date): string {
  if (period === "day") {
    return referenceDate.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
  }
  if (period === "week") {
    const start = new Date(referenceDate);
    start.setDate(referenceDate.getDate() - referenceDate.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${start.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit" })} - ${end.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" })}`;
  }
  return referenceDate.toLocaleDateString("es-MX", { month: "long", year: "numeric" }).replace(/^\w/, (c) => c.toUpperCase());
}

export function getSalesStatsForPeriod(
  period: ReportPeriod,
  referenceDate?: Date
): SalesStatsForPeriod {
  const ref = referenceDate ?? new Date();
  const history = getHistory();
  const entries = history.map((e) => ({
    date: new Date(e.timestamp),
    quantity: e.quantity,
    bottleName: e.bottleName,
    unit: e.unit === "units" ? "unid" : "oz",
    price: e.price ?? 0,
    subtotal: e.subtotal ?? 0,
  }));
  const filtered = filterByPeriod(entries, period, ref);
  let total = 0;
  let totalRevenue = 0;
  const byProduct: Record<string, { quantity: number; unit: string; revenue: number }> = {};
  const detailLines: DetailLine[] = [];

  for (const e of filtered) {
    total += e.quantity;
    totalRevenue += e.subtotal;
    if (!byProduct[e.bottleName]) byProduct[e.bottleName] = { quantity: 0, unit: e.unit, revenue: 0 };
    byProduct[e.bottleName].quantity += e.quantity;
    byProduct[e.bottleName].revenue += e.subtotal;
    if (e.price > 0 && e.subtotal > 0) {
      detailLines.push({
        name: e.bottleName,
        quantity: e.quantity,
        price: e.price,
        subtotal: e.subtotal,
      });
    }
  }

  const topProducts = Object.entries(byProduct)
    .map(([name, { quantity, unit, revenue }]) => ({ name, quantity, unit, revenue: revenue > 0 ? revenue : undefined }))
    .sort((a, b) => (b.revenue ?? 0) - (a.revenue ?? 0) || b.quantity - a.quantity)
    .slice(0, 10);

  const label = period === "day" && isSameDay(ref, new Date())
    ? "Día (hoy)"
    : period === "week" && isSameWeek(ref, new Date())
      ? "Semana"
      : period === "month" && isSameMonth(ref, new Date())
        ? "Mes"
        : formatPeriodLabel(period, ref);
  return { total, totalRevenue, label, topProducts, detailLines };
}

/** Devuelve estadísticas de ventas para un turno (para usuario limitado) */
export function getSalesStatsForShift(shiftId: string): SalesStatsForPeriod {
  const sales = getSalesByShift(shiftId);
  let total = 0;
  let totalRevenue = 0;
  const byProduct: Record<string, { quantity: number; unit: string; revenue: number }> = {};
  const detailLines: DetailLine[] = [];

  for (const sale of sales) {
    totalRevenue += sale.total;
    for (const item of sale.items) {
      const price = item.price ?? 0;
      const subtotal = price * item.quantity;
      total += item.quantity;
      if (!byProduct[item.name]) byProduct[item.name] = { quantity: 0, unit: "unid", revenue: 0 };
      byProduct[item.name].quantity += item.quantity;
      byProduct[item.name].revenue += subtotal;
      if (price > 0) {
        detailLines.push({ name: item.name, quantity: item.quantity, price, subtotal });
      }
    }
  }

  const topProducts = Object.entries(byProduct)
    .map(([name, { quantity, unit, revenue }]) => ({ name, quantity, unit, revenue: revenue > 0 ? revenue : undefined }))
    .sort((a, b) => (b.revenue ?? 0) - (a.revenue ?? 0) || b.quantity - a.quantity)
    .slice(0, 10);

  return {
    total,
    totalRevenue,
    label: "Turno actual",
    topProducts,
    detailLines,
  };
}

/** Genera texto para descargar como .txt (resumen de todos los períodos) */
export function buildReportText(stats: SalesStats): string {
  const lines: string[] = [
    "Reporte de ventas - Servipartz",
    `Generado: ${new Date().toLocaleString("es-ES")}`,
    "",
    "Ingresos por período",
    "--------------------",
    `${stats.dayLabel}: $${stats.dayRevenue.toFixed(2)}`,
    `${stats.weekLabel}: $${stats.weekRevenue.toFixed(2)}`,
    `${stats.monthLabel}: $${stats.monthRevenue.toFixed(2)}`,
    "",
    "Lo más vendido",
    "--------------",
    ...stats.topProducts.map((p, i) =>
      p.revenue != null
        ? `${i + 1}. ${p.name}: ${p.quantity} ${p.unit} = $${p.revenue.toFixed(2)}`
        : `${i + 1}. ${p.name}: ${p.quantity.toFixed(1)} ${p.unit}`
    ),
    "",
    "--- Servipartz ---",
  ];
  return lines.join("\n");
}

/** Genera texto del reporte para turno actual */
export function buildReportTextForShift(shiftStats: SalesStatsForPeriod): string {
  return buildReportTextForPeriod("day" as ReportPeriod, shiftStats);
}

/** Genera texto del reporte detallado para un período (día, semana o mes) */
export function buildReportTextForPeriod(period: ReportPeriod, periodStats: SalesStatsForPeriod): string {
  const lines: string[] = [
    `Reporte de ventas por ${periodStats.label} - Servipartz`,
    `Generado: ${new Date().toLocaleString("es-ES")}`,
    "",
    "Resumen",
    "-------",
    `Total ingresos: $${periodStats.totalRevenue.toFixed(2)}`,
    `Unidades vendidas: ${periodStats.total}`,
    "",
    "Detalle de ventas (producto, cantidad, precio, subtotal)",
    "--------------------------------------------------------",
  ];

  if (periodStats.detailLines.length === 0) {
    lines.push("Sin datos de ventas con precio en este período.");
  } else {
    const fmt = (n: number) => n.toFixed(2);
    for (const d of periodStats.detailLines) {
      lines.push(`${d.name}`);
      lines.push(`  Cant: ${d.quantity}  |  Precio unit: $${fmt(d.price)}  |  Subtotal: $${fmt(d.subtotal)}`);
    }
  }

  lines.push("");
  lines.push("Lo más vendido en el período");
  lines.push("-----------------------------");
  if (periodStats.topProducts.length === 0) {
    lines.push("Sin datos");
  } else {
    periodStats.topProducts.forEach((p, i) => {
      if (p.revenue != null) {
        lines.push(`${i + 1}. ${p.name}: ${p.quantity} ${p.unit} = $${p.revenue.toFixed(2)}`);
      } else {
        lines.push(`${i + 1}. ${p.name}: ${p.quantity.toFixed(1)} ${p.unit}`);
      }
    });
  }

  lines.push("");
  lines.push("--- Servipartz ---");
  return lines.join("\n");
}

/** Genera HTML del reporte para imprimir (estilo ticket) */
function buildReportHtml(text: string, title: string): string {
  const escaped = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</title>
  <style>
    body { font-family: monospace; font-size: 11px; padding: 16px; max-width: 320px; margin: 0 auto; }
    pre { white-space: pre-wrap; word-wrap: break-word; margin: 0; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <pre id="report-content">${escaped}</pre>
</body>
</html>`;
}

/** Imprime el reporte de ventas del turno actual */
export function printReportForShift(shiftId: string): void {
  const periodStats = getSalesStatsForShift(shiftId);
  const text = buildReportTextForShift(periodStats);
  const title = `Reporte ventas - ${periodStats.label}`;
  const html = buildReportHtml(text, title);
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Permite ventanas emergentes para imprimir el reporte");
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
}

/** Imprime el reporte de ventas por período (igual que los tickets) */
export function printReportForPeriod(period: ReportPeriod, referenceDate?: Date): void {
  const periodStats = getSalesStatsForPeriod(period, referenceDate);
  const text = buildReportTextForPeriod(period, periodStats);
  const title = `Reporte ventas - ${periodStats.label}`;
  const html = buildReportHtml(text, title);
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Permite ventanas emergentes para imprimir el reporte");
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
}
