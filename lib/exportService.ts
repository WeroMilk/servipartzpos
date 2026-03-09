/**
 * Servicio de exportación/backup de datos.
 * Soporta inventario, ventas, movimientos y exportación completa.
 */

import { loadInventory } from "./inventoryStorage";
import { getSalesHistoryForExport } from "./salesReport";
import { movementsService } from "./movements";
import { useFirebase } from "./firebase";
import { storeStore } from "./storeStore";
import {
  getStoreProducts,
  getStoreSales,
  getStoreMovements,
} from "./firestore";
import { isMeasuredInUnits } from "./measurementRules";
import { DEFAULT_PRODUCTS } from "./productsData";

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Formato de inventario para exportación */
export interface ExportInventoryItem {
  id: string;
  name: string;
  category: string;
  sku?: string;
  barcode?: string;
  price?: number;
  stock: number;
}

/** Exporta inventario como JSON (modo demo) o desde Firestore */
export async function exportInventory(format: "json" | "csv" = "json"): Promise<void> {
  const storeId = storeStore.getStoreId();
  const isDefaultStore = storeId === "default";

  let items: ExportInventoryItem[];

  if (isDefaultStore || !useFirebase) {
    const bottles = loadInventory();
    items = bottles.map((b) => {
      const prod = DEFAULT_PRODUCTS.find((p) => p.id === b.id);
      const useUnits = isMeasuredInUnits(b.category);
      const stock = useUnits ? (b.currentUnits ?? 0) : Math.floor((b.currentOz ?? 0) / 29.57);
      return {
        id: b.id,
        name: b.name,
        category: b.category,
        sku: prod?.sku,
        barcode: prod?.barcode,
        price: b.price,
        stock,
      };
    });
  } else if (storeId && useFirebase) {
    const prods = await getStoreProducts(storeId);
    items = prods.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      sku: p.sku,
      barcode: p.barcode,
      price: p.price,
      stock: p.stock,
    }));
  } else {
    items = [];
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `inventario-servipartz-${dateStr}`;

  if (format === "json") {
    downloadFile(
      JSON.stringify({ exportedAt: new Date().toISOString(), inventory: items }, null, 2),
      `${filename}.json`,
      "application/json"
    );
  } else {
    const headers = "id,nombre,categoria,sku,barcode,precio,stock";
    const rows = items.map(
      (i) =>
        `${i.id},"${(i.name || "").replace(/"/g, '""')}",${i.category},"${i.sku || ""}","${i.barcode || ""}",${i.price ?? ""},${i.stock}`
    );
    downloadFile(`${headers}\n${rows.join("\n")}`, `${filename}.csv`, "text/csv;charset=utf-8");
  }
}

/** Exporta ventas como JSON o CSV */
export async function exportSales(format: "json" | "csv" = "json"): Promise<void> {
  const storeId = storeStore.getStoreId();
  const isDefaultStore = storeId === "default";

  let salesData: Array<{
    timestamp: string;
    productName: string;
    quantity: number;
    price?: number;
    subtotal?: number;
  }>;

  if (isDefaultStore || !useFirebase) {
    const history = getSalesHistoryForExport();
    salesData = history.map((e) => ({
      timestamp: e.timestamp,
      productName: e.bottleName,
      quantity: e.quantity,
      price: e.price,
      subtotal: e.subtotal,
    }));
  } else if (storeId && useFirebase) {
    const sales = await getStoreSales(storeId, 365);
    const flat: typeof salesData = [];
    for (const s of sales) {
      for (const item of s.items) {
        flat.push({
          timestamp: s.timestamp instanceof Date ? s.timestamp.toISOString() : String(s.timestamp),
          productName: item.name,
          quantity: item.quantity,
          price: item.price,
          subtotal: (item.price ?? 0) * item.quantity,
        });
      }
    }
    salesData = flat;
  } else {
    salesData = [];
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `ventas-servipartz-${dateStr}`;

  if (format === "json") {
    downloadFile(
      JSON.stringify({ exportedAt: new Date().toISOString(), sales: salesData }, null, 2),
      `${filename}.json`,
      "application/json"
    );
  } else {
    const headers = "fecha,producto,cantidad,precio,subtotal";
    const rows = salesData.map(
      (s) =>
        `${s.timestamp},"${(s.productName || "").replace(/"/g, '""')}",${s.quantity},${s.price ?? ""},${s.subtotal ?? ""}`
    );
    downloadFile(`${headers}\n${rows.join("\n")}`, `${filename}.csv`, "text/csv;charset=utf-8");
  }
}

/** Exporta movimientos como JSON */
export async function exportMovements(): Promise<void> {
  const storeId = storeStore.getStoreId();

  let movementsData: Array<{
    id: string;
    bottleId: string;
    bottleName: string;
    type: string;
    oldValue?: number;
    newValue: number;
    timestamp: string;
    userName: string;
    description?: string;
  }>;

  if (storeId === "default" || !useFirebase) {
    const movs = movementsService.getAll();
    movementsData = movs.map((m) => ({
      id: m.id,
      bottleId: m.bottleId,
      bottleName: m.bottleName,
      type: m.type,
      oldValue: m.oldValue,
      newValue: m.newValue,
      timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : String(m.timestamp),
      userName: m.userName,
      description: m.description,
    }));
  } else if (storeId && useFirebase) {
    const movs = await getStoreMovements(storeId, 500);
    movementsData = movs.map((m) => ({
      id: m.id,
      bottleId: m.productId,
      bottleName: m.productName,
      type: m.type,
      oldValue: m.oldValue,
      newValue: m.newValue,
      timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : String(m.timestamp),
      userName: m.userName,
    }));
  } else {
    movementsData = [];
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `movimientos-servipartz-${dateStr}.json`;
  downloadFile(
    JSON.stringify({ exportedAt: new Date().toISOString(), movements: movementsData }, null, 2),
    filename,
    "application/json"
  );
}

/** Exporta todo: inventario, ventas y movimientos en un solo JSON */
export async function exportAll(): Promise<void> {
  const storeId = storeStore.getStoreId();
  const isDefaultStore = storeId === "default";

  let inventory: ExportInventoryItem[] = [];
  let sales: Array<{ timestamp: string; productName: string; quantity: number; price?: number; subtotal?: number }> = [];
  let movements: Array<Record<string, unknown>> = [];

  if (isDefaultStore || !useFirebase) {
    const bottles = loadInventory();
    inventory = bottles.map((b) => {
      const prod = DEFAULT_PRODUCTS.find((p) => p.id === b.id);
      const useUnits = isMeasuredInUnits(b.category);
      const stock = useUnits ? (b.currentUnits ?? 0) : Math.floor((b.currentOz ?? 0) / 29.57);
      return {
        id: b.id,
        name: b.name,
        category: b.category,
        sku: prod?.sku,
        barcode: prod?.barcode,
        price: b.price,
        stock,
      };
    });
    const history = getSalesHistoryForExport();
    sales = history.map((e) => ({
      timestamp: e.timestamp,
      productName: e.bottleName,
      quantity: e.quantity,
      price: e.price,
      subtotal: e.subtotal,
    }));
    movements = movementsService.getAll().map((m) => ({
      ...m,
      timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : String(m.timestamp),
    }));
  } else if (storeId && useFirebase) {
    const [prods, salesList, movs] = await Promise.all([
      getStoreProducts(storeId),
      getStoreSales(storeId, 365),
      getStoreMovements(storeId, 500),
    ]);
    inventory = prods.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      sku: p.sku,
      barcode: p.barcode,
      price: p.price,
      stock: p.stock,
    }));
    for (const s of salesList) {
      for (const item of s.items) {
        sales.push({
          timestamp: s.timestamp instanceof Date ? s.timestamp.toISOString() : String(s.timestamp),
          productName: item.name,
          quantity: item.quantity,
          price: item.price,
          subtotal: (item.price ?? 0) * item.quantity,
        });
      }
    }
    movements = movs.map((m) => ({
      ...m,
      timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : String(m.timestamp),
    }));
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    storeId: storeId ?? "default",
    storeName: storeStore.getStoreName() ?? "Matriz",
    inventory,
    sales,
    movements,
  };

  const dateStr = new Date().toISOString().slice(0, 16).replace("T", "-").replace(":", "");
  const filename = `backup-servipartz-${dateStr}.json`;
  downloadFile(JSON.stringify(payload, null, 2), filename, "application/json");
}
