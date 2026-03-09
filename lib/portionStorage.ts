/**
 * Porción por servicio por categoría (oz o unidades).
 * Misma lógica que PortionSelector: localStorage "portion-{category}" o valor por defecto.
 */

const PORTION_KEY = (category: string) => `portion-${category}`;

/** Por defecto todas las categorías usan 1 oz (o 1 unid para cerveza/unidades). */
const DEFAULT_PORTIONS: Record<string, number> = {
  vodka: 1,
  tequila: 1,
  whiskey: 1,
  whisky: 1,
  ron: 1,
  gin: 1,
  ginebra: 1,
  cerveza: 1,
  mezcal: 1,
  vino: 1,
  champagne: 1,
  brandy: 1,
  licores: 1,
  pisco: 1,
  sidra: 1,
};

export function getPortionForCategory(category: string): number {
  if (typeof window === "undefined") {
    return DEFAULT_PORTIONS[category?.toLowerCase()] ?? 1;
  }
  const saved = localStorage.getItem(PORTION_KEY(category));
  if (saved) {
    const n = parseFloat(saved);
    if (!Number.isNaN(n) && n > 0) return n;
  }
  return DEFAULT_PORTIONS[category?.toLowerCase()] ?? 1;
}
