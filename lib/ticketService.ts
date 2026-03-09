import { SERVIPARTZ_INFO } from "./storeInfo";
import type { SaleItem, PaymentMethod } from "./types";

export interface TicketData {
  items: SaleItem[];
  total: number;
  ticketNumber: number;
  employeeName?: string;
  paymentMethod: PaymentMethod;
  amountReceived?: number;
  change?: number;
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

  const lines: string[] = [];
  lines.push("========================================");
  lines.push(`        ${SERVIPARTZ_INFO.name}`);
  lines.push(`  ${SERVIPARTZ_INFO.tagline}`);
  lines.push("========================================");
  lines.push(SERVIPARTZ_INFO.address);
  lines.push(SERVIPARTZ_INFO.city);
  lines.push(`Tel: ${SERVIPARTZ_INFO.phone}`);
  lines.push("========================================");
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
  lines.push(`Subtotal:            $${data.total.toFixed(2)}`);
  lines.push(`Total:               $${data.total.toFixed(2)}`);
  lines.push("----------------------------------------");
  const paymentLabel =
    data.paymentMethod === "tarjeta_debito"
      ? "Tarjeta débito"
      : data.paymentMethod === "tarjeta_credito"
        ? "Tarjeta crédito"
        : data.paymentMethod.charAt(0).toUpperCase() + data.paymentMethod.slice(1);
  lines.push(`Pago: ${paymentLabel}`);
  if (data.paymentMethod === "efectivo" && data.amountReceived != null) {
    lines.push(`Recibido:            $${data.amountReceived.toFixed(2)}`);
    if (data.change != null) lines.push(`Cambio:              $${data.change.toFixed(2)}`);
  }
  lines.push("========================================");
  lines.push("   Gracias por su compra");
  for (const h of SERVIPARTZ_INFO.hours.split("\n")) {
    lines.push(`   ${h}`);
  }
  lines.push("========================================");

  const text = lines.join("\n");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Ticket #${ticketNum}</title>
  <style>
    body { font-family: monospace; font-size: 12px; padding: 16px; max-width: 320px; margin: 0 auto; }
    pre { white-space: pre-wrap; word-wrap: break-word; margin: 0; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <pre id="ticket-content">${text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
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
