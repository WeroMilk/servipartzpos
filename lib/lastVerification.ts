/** Última vez que se marcó "inventario correcto" (check verde) por botella */
const LAST_VERIFICATION_KEY = "mibarra-last-verification";

export function getLastVerification(bottleId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LAST_VERIFICATION_KEY);
    if (!raw) return null;
    const map: Record<string, string> = JSON.parse(raw);
    return map[bottleId] ?? null;
  } catch {
    return null;
  }
}

export function setLastVerification(bottleId: string, isoDate: string): void {
  try {
    const raw = localStorage.getItem(LAST_VERIFICATION_KEY);
    const map: Record<string, string> = raw ? JSON.parse(raw) : {};
    map[bottleId] = isoDate;
    localStorage.setItem(LAST_VERIFICATION_KEY, JSON.stringify(map));
  } catch {
    // Ignorar fallo de escritura en localStorage
  }
}

export function formatLastVerification(isoDate: string | null): string {
  if (!isoDate) return "Nunca verificada";
  try {
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(isoDate));
  } catch {
    return "Nunca verificada";
  }
}
