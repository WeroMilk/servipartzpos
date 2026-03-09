/**
 * Gestión de turnos (apertura/cierre) para corte de caja.
 */

export interface Shift {
  id: string;
  storeId: string;
  employeeId: string;
  employeeName: string;
  openedAt: Date;
  closedAt?: Date;
  initialCash: number;
  status: "open" | "closed";
}

const SHIFTS_KEY = "servipartz-shifts";

function getShifts(): (Omit<Shift, "openedAt" | "closedAt"> & {
  openedAt: string;
  closedAt?: string;
})[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SHIFTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveShifts(
  shifts: (Omit<Shift, "openedAt" | "closedAt"> & {
    openedAt: string;
    closedAt?: string;
  })[]
) {
  try {
    localStorage.setItem(SHIFTS_KEY, JSON.stringify(shifts));
  } catch {
    // ignore
  }
}

function toShift(
  r: Omit<Shift, "openedAt" | "closedAt"> & { openedAt: string; closedAt?: string }
): Shift {
  return {
    ...r,
    openedAt: new Date(r.openedAt),
    closedAt: r.closedAt ? new Date(r.closedAt) : undefined,
  };
}

/** Obtiene el turno abierto actual para la tienda */
export function getCurrentShift(storeId: string): Shift | null {
  const shifts = getShifts();
  const found = shifts.find(
    (s) => s.storeId === storeId && s.status === "open"
  );
  return found ? toShift(found) : null;
}

/** Abre un nuevo turno */
export function openShift(
  storeId: string,
  employeeId: string,
  employeeName: string,
  initialCash: number
): Shift {
  const shifts = getShifts();
  const id = `shift-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const now = new Date().toISOString();
  const newShift = {
    id,
    storeId,
    employeeId,
    employeeName,
    openedAt: now,
    initialCash,
    status: "open" as const,
  };
  shifts.unshift(newShift);
  saveShifts(shifts);
  return toShift(newShift);
}

/** Cierra un turno */
export function closeShift(shiftId: string, closedAt?: Date): void {
  const shifts = getShifts();
  const idx = shifts.findIndex((s) => s.id === shiftId);
  if (idx === -1) return;
  shifts[idx] = {
    ...shifts[idx],
    status: "closed",
    closedAt: (closedAt ?? new Date()).toISOString(),
  };
  saveShifts(shifts);
}

/** Obtiene turnos de una tienda */
export function getShiftsForStore(storeId: string, limit = 50): Shift[] {
  const shifts = getShifts();
  return shifts
    .filter((s) => s.storeId === storeId)
    .slice(0, limit)
    .map(toShift);
}

/** Obtiene un turno por ID */
export function getShiftById(shiftId: string): Shift | null {
  const shifts = getShifts();
  const found = shifts.find((s) => s.id === shiftId);
  return found ? toShift(found) : null;
}
