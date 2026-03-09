/** Colores por categoría para productos (repuestos electrodomésticos) - Servipartz */
export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    refrigeradores: "#dbeafe",
    licuadoras: "#dcfce7",
    lavadoras: "#e0e7ff",
    microondas: "#fef3c7",
    estufas: "#fee2e2",
    aires: "#e0f2fe",
    soldadura: "#f3e8ff",
    industrial: "#d1fae5",
    otros: "#f3f4f6",
  };
  return colors[category.toLowerCase()] || "#2563eb";
}

/** Color del contorno para productos */
export function getBottleOutlineColor(category: string): string {
  return getCategoryColor(category);
}
