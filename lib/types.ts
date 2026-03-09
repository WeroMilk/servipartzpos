/** Producto = repuesto de electrodoméstico (reemplaza Bottle para POS repuestos) */
export interface Product {
  id: string;
  name: string;
  category: string;
  sku?: string;
  price?: number;
  stock: number;
  image?: string;
  description?: string;
}

/** Tienda / sucursal */
export interface Store {
  id: string;
  name: string;
  address?: string;
  createdAt: Date;
}

/** Usuario con rol para multi-tienda */
export interface User {
  id: string;
  email: string;
  name?: string;
  role: "admin" | "store_user";
  storeIds?: string[];
}

/** Ítem de una venta */
export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  price?: number;
}

/** Venta registrada */
export interface Sale {
  id: string;
  items: SaleItem[];
  total: number;
  timestamp: Date;
  employeeId?: string;
  employeeName?: string;
}

/** Movimiento de inventario */
export interface Movement {
  id: string;
  productId: string;
  productName: string;
  type: "edit" | "import_sales" | "import_order" | "inventory" | "sale";
  oldValue: number;
  newValue: number;
  timestamp: Date;
  userName: string;
}

// --- Compatibilidad con MiBarra (se depreca gradualmente) ---
export interface Bottle {
  id: string;
  name: string;
  category: string;
  size: number;
  currentOz: number;
  sizeUnits?: number;
  currentUnits?: number;
  image?: string;
  brand?: string;
  type?: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
}

export interface Bar {
  id: string;
  userId: string;
  name: string;
  softRestaurantCode?: string;
  bottles: Bottle[];
  createdAt: Date;
}
