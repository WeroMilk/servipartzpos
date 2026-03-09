import { Bottle } from "./types";
import { isMeasuredInUnits } from "./measurementRules";

const ML_TO_OZ = 0.033814;

function getBottleStats(bottle: Bottle) {
  const useUnits = isMeasuredInUnits(bottle.category);
  const capacityUnits = useUnits ? (bottle.sizeUnits ?? 100) : 0;
  const remainingUnits = useUnits
    ? (bottle.currentUnits ?? Math.round(capacityUnits * (bottle.currentOz / bottle.size)))
    : 0;
  const toOrderUnits = useUnits ? Math.max(0, capacityUnits - remainingUnits) : 0;
  const percentageUnits =
    useUnits && capacityUnits > 0 ? (remainingUnits / capacityUnits) * 100 : 0;

  const sizeOz = bottle.size * ML_TO_OZ;
  const currentOz = bottle.currentOz * ML_TO_OZ;
  const percentageOz = sizeOz > 0 ? (currentOz / sizeOz) * 100 : 0;

  const percentage = useUnits ? percentageUnits : percentageOz;
  return {
    useUnits,
    toOrderUnits,
    percentage,
    remainingUnits,
    currentOz,
    sizeOz,
    capacityUnits,
  };
}

export interface OrderReportLine {
  name: string;
  quantity: string; // "12 unid" o "5.2 oz" o "18%"
  reason: "por_pedir" | "bajo_25";
}

export function buildOrderReport(bottles: Bottle[]): { text: string; lines: OrderReportLine[] } {
  const lines: OrderReportLine[] = [];
  const barName = typeof window !== "undefined"
    ? (() => {
        try {
          const u = localStorage.getItem("demo_user");
          if (u) return (JSON.parse(u) as { barName?: string }).barName ?? "Mi Barra";
        } catch {}
        return "Mi Barra";
      })()
    : "Mi Barra";

  const porPedir: OrderReportLine[] = [];
  const bajo25: OrderReportLine[] = [];

  for (const bottle of bottles) {
    const s = getBottleStats(bottle);
    if (s.useUnits && s.toOrderUnits > 0) {
      porPedir.push({
        name: bottle.name,
        quantity: `${s.toOrderUnits} unid`,
        reason: "por_pedir",
      });
    }
    if (s.percentage < 25) {
      bajo25.push({
        name: bottle.name,
        quantity: s.useUnits
          ? `${Math.round(s.percentage)}% (${s.remainingUnits} unid rest.)`
          : `${Math.round(s.percentage)}% (${s.currentOz.toFixed(1)} oz rest.)`,
        reason: "bajo_25",
      });
    }
  }

  // Eliminar duplicados: si una botella está en por pedir y también bajo 25%, solo en por pedir (o en ambos con una sola línea)
  const bajo25SinRepetir = bajo25.filter(
    (b) => !porPedir.some((p) => p.name === b.name)
  );
  lines.push(...porPedir, ...bajo25SinRepetir);

  const dateStr = new Date().toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  let text = `PEDIDO - ${barName}\n`;
  text += `Generado: ${dateStr}\n`;
  text += `${"=".repeat(32)}\n\n`;

  if (porPedir.length > 0) {
    text += "POR PEDIR (unidades):\n";
    porPedir.forEach((l) => {
      text += `• ${l.name}: ${l.quantity}\n`;
    });
    text += "\n";
  }

  if (bajo25SinRepetir.length > 0) {
    text += "POR DEBAJO DEL 25%:\n";
    bajo25SinRepetir.forEach((l) => {
      text += `• ${l.name}: ${l.quantity}\n`;
    });
    text += "\n";
  }

  if (lines.length === 0) {
    text += "No hay botellas por pedir ni por debajo del 25%. Barra bien surtida.\n";
  }

  text += "\n--- MiBarra ---";

  return { text, lines };
}
