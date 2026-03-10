"use client";

import { collection, query, orderBy } from "firebase/firestore";
import { db, useFirebase } from "@/lib/firebase";
import type { Sale, SaleItem } from "@/lib/types";
import { useRealtimeCollection } from "./useRealtimeCollection";

export interface UseSalesResult {
  sales: Sale[];
  loading: boolean;
  error: Error | null;
}

/**
 * Ventas en tiempo real por tienda.
 */
export function useSalesByStore(storeId: string | null): UseSalesResult {
  const cloudEnabled = !!storeId && storeId !== "default" && useFirebase && !!db;

  const { data, loading, error } = useRealtimeCollection<Sale>(
    cloudEnabled,
    () => {
      if (!db) {
        throw new Error("Firestore no inicializado");
      }
      return query(
        collection(db, "stores", storeId!, "sales"),
        orderBy("timestamp", "desc")
      );
    },
    (snap) => {
      const data = snap.data() as any;
      return {
        id: snap.id,
        items: (data.items || []) as SaleItem[],
        total: data.total ?? 0,
        timestamp: data.timestamp?.toDate
          ? data.timestamp.toDate()
          : new Date(data.timestamp),
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        paymentMethod: data.paymentMethod,
        payments: data.payments,
        amountReceived: data.amountReceived,
        change: data.change,
        ticketNumber: data.ticketNumber,
        subtotalBeforeDiscount: data.subtotalBeforeDiscount,
        discountTotal: data.discountTotal,
      } satisfies Sale;
    }
  );

  return { sales: data, loading, error };
}

