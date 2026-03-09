/**
 * Regla de medida: todos los productos (repuestos) se miden en unidades.
 */

export function isMeasuredInUnits(_category: string): boolean {
  return true;
}

export function getUnitLabel(_category: string): string {
  return "unidades";
}

export function getUnitShortLabel(_category: string): string {
  return "unid";
}

/** Para movimientos: todos los productos usan unidades */
export function isBeerBottleId(_bottleId: string): boolean {
  return true;
}
