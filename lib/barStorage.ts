import { Bottle } from "./types";

/** Clave de localStorage donde se guarda el inventario seleccionado (Mi Inventario → Mi Barra). */
export const BAR_BOTTLES_KEY = "barra-bar-bottles";

/**
 * Carga las botellas del bar desde localStorage.
 * Si no hay nada guardado, devuelve array vacío (el usuario elige desde Configuración → Modifica tu inventario).
 */
export function loadBarBottles(): Bottle[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(BAR_BOTTLES_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Bottle[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Ignorar datos corruptos en localStorage
  }
  return [];
}

/**
 * Guarda las botellas del bar (las que el usuario eligió en Mi Inventario).
 */
export function saveBarBottles(bottles: Bottle[]): void {
  try {
    localStorage.setItem(BAR_BOTTLES_KEY, JSON.stringify(bottles));
  } catch {
    // Ignorar fallo de escritura en localStorage
  }
}

/**
 * Devuelve los IDs de las botellas actualmente guardadas como inventario del bar.
 * Útil para pre-seleccionar en la pantalla "Modifica tu inventario".
 */
export function getBarBottleIds(): Set<string> {
  const bottles = loadBarBottles();
  return new Set(bottles.map((b) => b.id));
}
