import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { db, useFirebase } from "./firebase";
import type { Product, Store, Sale, SaleItem, Movement, PaymentMethod, PaymentSplit, SaleRecord } from "./types";
import { getDefaultProductsWithStock } from "./productsData";

/** Convierte Firestore Timestamp a Date */
function toDate(val: unknown): Date {
  if (val instanceof Date) return val;
  if (val && typeof val === "object" && "toDate" in val && typeof (val as { toDate: () => Date }).toDate === "function") {
    return (val as { toDate: () => Date }).toDate();
  }
  if (val && typeof val === "object" && "seconds" in val) {
    return new Date((val as { seconds: number }).seconds * 1000);
  }
  return new Date();
}

// --- Stores ---

export async function getStores(): Promise<Store[]> {
  if (!db || !useFirebase) return [];
  const snap = await getDocs(collection(db, "stores"));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name || "",
      address: data.address,
      createdAt: toDate(data.createdAt),
    };
  });
}

export async function getStore(storeId: string): Promise<Store | null> {
  if (!db || !useFirebase) return null;
  const ref = doc(db, "stores", storeId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    name: data?.name || "",
    address: data?.address,
    createdAt: toDate(data?.createdAt),
  };
}

export async function createStore(name: string, address?: string): Promise<Store> {
  if (!db || !useFirebase) throw new Error("Firebase no configurado");
  const ref = doc(collection(db, "stores"));
  const store: Omit<Store, "id"> & { id: string } = {
    id: ref.id,
    name,
    address,
    createdAt: new Date(),
  };
  await setDoc(ref, {
    name: store.name,
    address: store.address ?? null,
    createdAt: Timestamp.fromDate(store.createdAt),
  });
  return store;
}

export async function updateStore(storeId: string, data: { name?: string; address?: string }): Promise<void> {
  if (!db || !useFirebase) throw new Error("Firebase no configurado");
  const ref = doc(db, "stores", storeId);
  const updates: Record<string, unknown> = {};
  if (data.name !== undefined) updates.name = data.name;
  if (data.address !== undefined) updates.address = data.address;
  if (Object.keys(updates).length === 0) return;
  await updateDoc(ref, updates);
}

export async function deleteStore(storeId: string): Promise<void> {
  if (!db || !useFirebase) throw new Error("Firebase no configurado");
  const storeRef = doc(db, "stores", storeId);
  const subcollections = ["products", "sales", "movements"];
  for (const sub of subcollections) {
    const snap = await getDocs(collection(db, "stores", storeId, sub));
    const batchSize = 500;
    let batch = writeBatch(db);
    let count = 0;
    for (const d of snap.docs) {
      batch.delete(d.ref);
      count++;
      if (count >= batchSize) {
        await batch.commit();
        batch = writeBatch(db);
        count = 0;
      }
    }
    if (count > 0) await batch.commit();
  }
  await deleteDoc(storeRef);
}

// --- Products (por tienda) ---

export async function getStoreProducts(storeId: string): Promise<Product[]> {
  if (!db || !useFirebase) return [];
  const snap = await getDocs(collection(db, "stores", storeId, "products"));
  if (snap.empty) return [];
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name || "",
      category: data.category || "",
      sku: data.sku,
      barcode: data.barcode,
      price: data.price,
      stock: data.stock ?? 0,
      image: data.image,
      description: data.description,
    };
  });
}

/** Inicializa inventario de una tienda con productos por defecto */
export async function initStoreProducts(storeId: string): Promise<Product[]> {
  if (!db || !useFirebase) return [];
  const defaults = getDefaultProductsWithStock(0);
  const batch = writeBatch(db);
  for (const p of defaults) {
    const ref = doc(db, "stores", storeId, "products", p.id);
    batch.set(ref, {
      name: p.name,
      category: p.category,
      sku: p.sku ?? null,
      barcode: p.barcode ?? null,
      price: p.price ?? null,
      stock: p.stock,
      image: p.image ?? null,
      description: p.description ?? null,
    });
  }
  await batch.commit();
  return defaults;
}

export async function updateProductStock(
  storeId: string,
  productId: string,
  newStock: number,
  productName: string
): Promise<void> {
  if (!db || !useFirebase) return;
  const ref = doc(db, "stores", storeId, "products", productId);
  await updateDoc(ref, { stock: newStock });
}

export async function setProduct(storeId: string, product: Product): Promise<void> {
  if (!db || !useFirebase) return;
  const ref = doc(db, "stores", storeId, "products", product.id);
  await setDoc(ref, {
    name: product.name,
    category: product.category,
    sku: product.sku ?? null,
    barcode: product.barcode ?? null,
    price: product.price ?? null,
    stock: product.stock,
    image: product.image ?? null,
    description: product.description ?? null,
  });
}

// --- Sales ---

export async function addSale(
  storeId: string,
  items: SaleItem[],
  total: number,
  employeeId?: string,
  employeeName?: string,
  options?: { paymentMethod?: PaymentMethod; amountReceived?: number; change?: number; ticketNumber?: number }
): Promise<string> {
  if (!db || !useFirebase) throw new Error("Firebase no configurado");
  const ref = collection(db, "stores", storeId, "sales");
  const docRef = await addDoc(ref, {
    items,
    total,
    timestamp: Timestamp.now(),
    employeeId: employeeId ?? null,
    employeeName: employeeName ?? null,
    paymentMethod: options?.paymentMethod ?? null,
    amountReceived: options?.amountReceived ?? null,
    change: options?.change ?? null,
    ticketNumber: options?.ticketNumber ?? null,
  });
  return docRef.id;
}

/** Guarda una venta completa (compatible con corte/turnos). */
export async function addSaleRecordFirestore(
  storeId: string,
  sale: Omit<SaleRecord, "id" | "timestamp"> & { timestamp?: Date }
): Promise<string> {
  if (!db || !useFirebase) throw new Error("Firebase no configurado");
  const ref = collection(db, "stores", storeId, "sales");
  const docRef = await addDoc(ref, {
    storeId,
    ticketNumber: sale.ticketNumber ?? null,
    shiftId: sale.shiftId ?? null,
    items: sale.items ?? [],
    total: sale.total ?? 0,
    subtotalBeforeDiscount: sale.subtotalBeforeDiscount ?? null,
    discountTotal: sale.discountTotal ?? null,
    payments: (sale.payments ?? null) as PaymentSplit[] | null,
    paymentMethod: sale.paymentMethod ?? null,
    amountReceived: sale.amountReceived ?? null,
    change: sale.change ?? null,
    employeeName: sale.employeeName ?? null,
    type: sale.type ?? "sale",
    originalTicketNumber: sale.originalTicketNumber ?? null,
    timestamp: Timestamp.fromDate(sale.timestamp ?? new Date()),
  });
  return docRef.id;
}

export async function getStoreSales(storeId: string, maxDays = 90): Promise<Sale[]> {
  if (!db || !useFirebase) return [];
  const ref = collection(db, "stores", storeId, "sales");
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - maxDays);
  const q = query(ref, orderBy("timestamp", "desc"), limit(500));
  const snap = await getDocs(q);
  const sales: Sale[] = [];
  for (const d of snap.docs) {
    const data = d.data();
    const ts = toDate(data.timestamp);
    if (ts < cutoff) continue;
    sales.push({
      id: d.id,
      items: (data.items || []) as SaleItem[],
      total: data.total ?? 0,
      timestamp: ts,
      employeeId: data.employeeId,
      employeeName: data.employeeName,
      paymentMethod: data.paymentMethod,
      amountReceived: data.amountReceived,
      change: data.change,
      ticketNumber: data.ticketNumber,
    });
  }
  return sales;
}

export async function getSalesByShiftFirestore(storeId: string, shiftId: string): Promise<SaleRecord[]> {
  if (!db || !useFirebase) return [];
  const ref = collection(db, "stores", storeId, "sales");
  const q = query(ref, where("shiftId", "==", shiftId), orderBy("timestamp", "desc"), limit(1000));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ticketNumber: data.ticketNumber ?? 0,
      storeId: data.storeId ?? storeId,
      shiftId: data.shiftId ?? shiftId,
      items: (data.items || []) as SaleItem[],
      total: data.total ?? 0,
      subtotalBeforeDiscount: data.subtotalBeforeDiscount ?? undefined,
      discountTotal: data.discountTotal ?? undefined,
      payments: (data.payments || undefined) as PaymentSplit[] | undefined,
      paymentMethod: data.paymentMethod ?? undefined,
      amountReceived: data.amountReceived ?? undefined,
      change: data.change ?? undefined,
      timestamp: toDate(data.timestamp),
      employeeName: data.employeeName ?? undefined,
      type: data.type ?? "sale",
      originalTicketNumber: data.originalTicketNumber ?? undefined,
    } as SaleRecord;
  });
}

export async function getSaleByTicketFirestore(storeId: string, ticketNumber: number): Promise<SaleRecord | null> {
  if (!db || !useFirebase) return null;
  const ref = collection(db, "stores", storeId, "sales");
  const q = query(ref, where("ticketNumber", "==", ticketNumber), orderBy("timestamp", "desc"), limit(1));
  const snap = await getDocs(q);
  const first = snap.docs[0];
  if (!first) return null;
  const data = first.data();
  return {
    id: first.id,
    ticketNumber: data.ticketNumber ?? ticketNumber,
    storeId: data.storeId ?? storeId,
    shiftId: data.shiftId ?? undefined,
    items: (data.items || []) as SaleItem[],
    total: data.total ?? 0,
    subtotalBeforeDiscount: data.subtotalBeforeDiscount ?? undefined,
    discountTotal: data.discountTotal ?? undefined,
    payments: (data.payments || undefined) as PaymentSplit[] | undefined,
    paymentMethod: data.paymentMethod ?? undefined,
    amountReceived: data.amountReceived ?? undefined,
    change: data.change ?? undefined,
    timestamp: toDate(data.timestamp),
    employeeName: data.employeeName ?? undefined,
    type: data.type ?? "sale",
    originalTicketNumber: data.originalTicketNumber ?? undefined,
  } as SaleRecord;
}

/** Obtiene ventas de todas las tiendas (para admin) */
export async function getAllStoresSales(storeIds: string[], maxDays = 90): Promise<{ storeId: string; sales: Sale[] }[]> {
  const results: { storeId: string; sales: Sale[] }[] = [];
  for (const storeId of storeIds) {
    const sales = await getStoreSales(storeId, maxDays);
    results.push({ storeId, sales });
  }
  return results;
}

// --- Movements ---

export async function addMovement(
  storeId: string,
  movement: Omit<Movement, "id" | "timestamp">
): Promise<void> {
  if (!db || !useFirebase) return;
  const ref = collection(db, "stores", storeId, "movements");
  await addDoc(ref, {
    ...movement,
    timestamp: Timestamp.now(),
  });
}

export async function getStoreMovements(storeId: string, limitCount = 100): Promise<Movement[]> {
  if (!db || !useFirebase) return [];
  const ref = collection(db, "stores", storeId, "movements");
  const q = query(ref, orderBy("timestamp", "desc"), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      productId: data.productId || "",
      productName: data.productName || "",
      type: data.type || "edit",
      oldValue: data.oldValue ?? 0,
      newValue: data.newValue ?? 0,
      timestamp: toDate(data.timestamp),
      userName: data.userName || "",
    };
  });
}

// --- Shifts ---

export interface ShiftRecord {
  id: string;
  storeId: string;
  employeeId: string;
  employeeName: string;
  openedAt: Date;
  closedAt?: Date;
  initialCash: number;
  status: "open" | "closed";
}

export async function openShiftFirestore(
  storeId: string,
  employeeId: string,
  employeeName: string,
  initialCash: number
): Promise<string> {
  if (!db || !useFirebase) throw new Error("Firebase no configurado");
  const ref = collection(db, "stores", storeId, "shifts");
  const docRef = await addDoc(ref, {
    storeId,
    employeeId,
    employeeName,
    openedAt: Timestamp.now(),
    closedAt: null,
    initialCash,
    status: "open",
  });
  return docRef.id;
}

export async function closeShiftFirestore(storeId: string, shiftId: string): Promise<void> {
  if (!db || !useFirebase) throw new Error("Firebase no configurado");
  const ref = doc(db, "stores", storeId, "shifts", shiftId);
  await updateDoc(ref, { status: "closed", closedAt: Timestamp.now() });
}

export async function getCurrentShiftFirestore(storeId: string): Promise<ShiftRecord | null> {
  if (!db || !useFirebase) return null;
  const ref = collection(db, "stores", storeId, "shifts");
  const q = query(ref, where("status", "==", "open"), orderBy("openedAt", "desc"), limit(1));
  const snap = await getDocs(q);
  const first = snap.docs[0];
  if (!first) return null;
  const data = first.data();
  return {
    id: first.id,
    storeId: data.storeId ?? storeId,
    employeeId: data.employeeId ?? "",
    employeeName: data.employeeName ?? "",
    openedAt: toDate(data.openedAt),
    closedAt: data.closedAt ? toDate(data.closedAt) : undefined,
    initialCash: data.initialCash ?? 0,
    status: data.status ?? "open",
  };
}

export async function getShiftsForStoreFirestore(storeId: string, limitCount = 50): Promise<ShiftRecord[]> {
  if (!db || !useFirebase) return [];
  const ref = collection(db, "stores", storeId, "shifts");
  const q = query(ref, orderBy("openedAt", "desc"), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      storeId: data.storeId ?? storeId,
      employeeId: data.employeeId ?? "",
      employeeName: data.employeeName ?? "",
      openedAt: toDate(data.openedAt),
      closedAt: data.closedAt ? toDate(data.closedAt) : undefined,
      initialCash: data.initialCash ?? 0,
      status: data.status ?? "open",
    } as ShiftRecord;
  });
}

export async function getShiftByIdFirestore(storeId: string, shiftId: string): Promise<ShiftRecord | null> {
  if (!db || !useFirebase) return null;
  const ref = doc(db, "stores", storeId, "shifts", shiftId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    storeId: data.storeId ?? storeId,
    employeeId: data.employeeId ?? "",
    employeeName: data.employeeName ?? "",
    openedAt: toDate(data.openedAt),
    closedAt: data.closedAt ? toDate(data.closedAt) : undefined,
    initialCash: data.initialCash ?? 0,
    status: data.status ?? "open",
  } as ShiftRecord;
}

// --- Users (perfil con rol) ---

export interface UserProfile {
  email: string;
  name?: string;
  role: "admin" | "store_user";
  storeIds?: string[];
  currentStoreId?: string;
  currentStoreName?: string;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!db || !useFirebase) return null;
  const ref = doc(db, "users", userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    email: data?.email || "",
    name: data?.name,
    role: data?.role || "store_user",
    storeIds: data?.storeIds || [],
    currentStoreId: data?.currentStoreId,
    currentStoreName: data?.currentStoreName,
  };
}

export async function setUserProfile(
  userId: string,
  profile: Partial<UserProfile>
): Promise<void> {
  if (!db || !useFirebase) return;
  const ref = doc(db, "users", userId);
  const snap = await getDoc(ref);
  const data: Record<string, unknown> = { ...profile };
  if (data.createdAt === undefined && !snap.exists()) {
    data.createdAt = Timestamp.now();
  }
  await setDoc(ref, data, { merge: true });
}
