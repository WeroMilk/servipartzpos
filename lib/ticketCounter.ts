/** Contador de tickets por tienda. Se guarda en localStorage. */

const KEY_PREFIX = "servipartz_ticket_counter_";

export function getNextTicketNumber(storeId: string): number {
  if (typeof window === "undefined") return 1;
  const key = KEY_PREFIX + storeId;
  try {
    const current = parseInt(localStorage.getItem(key) ?? "0", 10);
    const next = current + 1;
    localStorage.setItem(key, String(next));
    return next;
  } catch {
    return 1;
  }
}
