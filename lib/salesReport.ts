/**
 * Historial de ventas para reportes: día, semana, mes y detalle de lo vendido con precios.
 * Se alimenta desde la Caja al registrar ventas.
 */

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

/** Llamar desde Caja al registrar una venta. Guarda detalle con precios. */
export function addSalesFromImport(
  items: SaleItemForReport[],
  timestamp: Date
) {
  const iso = timestamp.toISOString();
  const history = getHistory();
  const cut = new Date();
  cut.setDate(cut.getDate() - MAX_DAYS);
  const filtered = history.filter((e) => new Date(e.timestamp) >= cut);
  const newEntries: SalesHistoryEntry[] = items.map((item) => {
    const price = item.price ?? 0;
    const subtotal = item.quantity * price;
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

function filterByPeriod<T extends { date: Date }>(entries: T[], period: ReportPeriod) {
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
    price: e.price ?? 0,
    subtotal: e.subtotal ?? 0,
  }));
  const filtered = filterByPeriod(entries, period);
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

  const labels: Record<ReportPeriod, string> = { day: "Día (hoy)", week: "Semana", month: "Mes" };
  return { total, totalRevenue, label: labels[period], topProducts, detailLines };
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

/** Imprime el reporte de ventas por período (igual que los tickets) */
export function printReportForPeriod(period: ReportPeriod): void {
  const periodStats = getSalesStatsForPeriod(period);
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
