/** Producto = repuesto de electrodoméstico (reemplaza Bottle para POS repuestos) */
export interface Product {
  id: string;
  name: string;
  category: string;
  sku?: string;
  barcode?: string;
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
  discountPercent?: number;
  discountAmount?: number;
}

export type PaymentMethod = "efectivo" | "tarjeta" | "tarjeta_debito" | "tarjeta_credito" | "transferencia";

/** Pago parcial para ventas con múltiples métodos */
export interface PaymentSplit {
  method: PaymentMethod;
  amount: number;
}

/** Venta registrada */
export interface Sale {
  id: string;
  items: SaleItem[];
  total: number;
  timestamp: Date;
  employeeId?: string;
  employeeName?: string;
  paymentMethod?: PaymentMethod;
  payments?: PaymentSplit[];
  amountReceived?: number;
  change?: number;
  ticketNumber?: number;
  subtotalBeforeDiscount?: number;
  discountTotal?: number;
  cfdiUuid?: string;
  cfdiXml?: string;
}

/** Registro de venta completa (para corte de caja y devoluciones) */
export interface SaleRecord {
  id: string;
  ticketNumber: number;
  storeId: string;
  shiftId?: string;
  items: SaleItem[];
  total: number;
  subtotalBeforeDiscount?: number;
  discountTotal?: number;
  payments?: PaymentSplit[];
  paymentMethod?: PaymentMethod;
  amountReceived?: number;
  change?: number;
  timestamp: Date;
  employeeName?: string;
  type?: "sale" | "return" | "void";
  originalTicketNumber?: number;
}

/** Movimiento de inventario */
export interface Movement {
  id: string;
  productId: string;
  productName: string;
  type: "edit" | "import_sales" | "import_order" | "inventory" | "sale" | "return";
  oldValue: number;
  newValue: number;
  timestamp: Date;
  userName: string;
}

// --- Tipos de producto e inventario ---
export interface Bottle {
  id: string;
  name: string;
  category: string;
  size: number;
  currentOz: number;
  sizeUnits?: number;
  currentUnits?: number;
  price?: number;
  image?: string;
  brand?: string;
  type?: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
}

/** @deprecated Usar storeStore y firestore para tiendas. */
export interface Bar {
  id: string;
  userId: string;
  name: string;
  softRestaurantCode?: string;
  bottles: Bottle[];
  createdAt: Date;
}
