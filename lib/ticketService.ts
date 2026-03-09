import { SERVIPARTZ_INFO } from "./storeInfo";
import type { SaleItem, PaymentMethod, PaymentSplit } from "./types";

export interface TicketData {
  items: SaleItem[];
  total: number;
  ticketNumber: number;
  employeeName?: string;
  paymentMethod: PaymentMethod;
  payments?: PaymentSplit[];
  amountReceived?: number;
  change?: number;
  subtotalBeforeDiscount?: number;
  discountTotal?: number;
  date?: Date;
}

/** Genera HTML del ticket para imprimir */
export function buildTicketHtml(data: TicketData): string {
  const date = data.date ?? new Date();
  const dateStr = date.toLocaleString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const ticketNum = String(data.ticketNumber).padStart(6, "0");
  const LINE_WIDTH = 40;
  const centerLine = (text: string) => {
    const len = text.length;
    if (len >= LINE_WIDTH) return text.slice(0, LINE_WIDTH);
    const pad = Math.floor((LINE_WIDTH - len) / 2);
    return " ".repeat(pad) + text + " ".repeat(LINE_WIDTH - pad - len);
  };

  const lines: string[] = [];
  lines.push("=".repeat(LINE_WIDTH));
  lines.push(centerLine(SERVIPARTZ_INFO.name));
  lines.push(centerLine(SERVIPARTZ_INFO.tagline));
  lines.push("=".repeat(LINE_WIDTH));
  lines.push(SERVIPARTZ_INFO.address);
  lines.push(SERVIPARTZ_INFO.city);
  lines.push(`Tel: ${SERVIPARTZ_INFO.phone}`);
  lines.push("=".repeat(LINE_WIDTH));
  lines.push(`Ticket #${ticketNum}`);
  lines.push(`Fecha: ${dateStr}`);
  if (data.employeeName) lines.push(`Cajero: ${data.employeeName}`);
  lines.push("----------------------------------------");
  lines.push("Producto              Cant    Precio");
  lines.push("----------------------------------------");

  for (const item of data.items) {
    const price = item.price ?? 0;
    const subtotal = price * item.quantity;
    const name = item.name.slice(0, 22).padEnd(22);
    const qty = String(item.quantity).padStart(4);
    const priceStr = `$${subtotal.toFixed(2)}`;
    lines.push(`${name} ${qty}  ${priceStr}`);
  }

  lines.push("----------------------------------------");
  if (data.subtotalBeforeDiscount != null && data.discountTotal != null && data.discountTotal > 0) {
    lines.push(`Subtotal:            $${data.subtotalBeforeDiscount.toFixed(2)}`);
    lines.push(`Descuento:           -$${data.discountTotal.toFixed(2)}`);
  }
  lines.push(`Total:               $${data.total.toFixed(2)}`);
  lines.push("----------------------------------------");
  if (data.payments && data.payments.length > 0) {
    lines.push("Pagos:");
    for (const p of data.payments) {
      const label =
        p.method === "tarjeta_debito"
          ? "Tarjeta débito"
          : p.method === "tarjeta_credito"
            ? "Tarjeta crédito"
            : p.method.charAt(0).toUpperCase() + p.method.slice(1);
      lines.push(`  ${label}: ${p.amount.toFixed(2)}`);
    }
  } else {
    const paymentLabel =
      data.paymentMethod === "tarjeta_debito"
        ? "Tarjeta débito"
        : data.paymentMethod === "tarjeta_credito"
          ? "Tarjeta crédito"
          : data.paymentMethod.charAt(0).toUpperCase() + data.paymentMethod.slice(1);
    lines.push(`Pago: ${paymentLabel}`);
  }
  if (data.amountReceived != null && data.amountReceived > 0) {
    lines.push(`Recibido:            $${data.amountReceived.toFixed(2)}`);
    if (data.change != null) lines.push(`Cambio:              $${data.change.toFixed(2)}`);
  }
  lines.push("=".repeat(LINE_WIDTH));
  lines.push(centerLine("Gracias por su compra"));
  for (const h of SERVIPARTZ_INFO.hours.split("\n")) {
    lines.push(centerLine(h));
  }
  lines.push("=".repeat(LINE_WIDTH));

  const escapedLines = lines.map((line) => line.replace(/</g, "&lt;").replace(/>/g, "&gt;"));
  const linesHtml = escapedLines.map((line) => `<div class="ticket-line">${line}</div>`).join("\n");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Ticket #${ticketNum}</title>
  <style>
    body { font-family: monospace; font-size: 12px; padding: 16px; max-width: 320px; margin: 0 auto; text-align: center; }
    .ticket-line { white-space: pre; word-wrap: break-word; margin: 0; text-align: center; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div id="ticket-content">${linesHtml}</div>
</body>
</html>`;
}

/** Imprime el ticket usando window.print */
export function printTicket(data: TicketData): void {
  const html = buildTicketHtml(data);
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Permite ventanas emergentes para imprimir el ticket");
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
