"use client";

import { collection, query, orderBy, limit as fbLimit } from "firebase/firestore";
import { db, useFirebase } from "@/lib/firebase";
import type { Movement } from "@/lib/types";
import { useRealtimeCollection } from "./useRealtimeCollection";

export interface UseMovementsResult {
  movements: Movement[];
  loading: boolean;
  error: Error | null;
}

/**
 * Movimientos en tiempo real para una tienda.
 */
export function useMovements(storeId: string | null, limit: number = 200): UseMovementsResult {
  const cloudEnabled = !!storeId && storeId !== "default" && useFirebase && !!db;

  const { data, loading, error } = useRealtimeCollection<Movement>(
    cloudEnabled,
    () => {
      if (!db) {
        throw new Error("Firestore no inicializado");
      }
      return query(
        collection(db, "stores", storeId!, "movements"),
        orderBy("timestamp", "desc"),
        fbLimit(limit)
      );
    },
    (snap) => {
      const data = snap.data() as any;
      return {
        id: snap.id,
        productId: data.productId || "",
        productName: data.productName || "",
        type: data.type || "edit",
        oldValue: data.oldValue ?? 0,
        newValue: data.newValue ?? 0,
        timestamp: data.timestamp?.toDate
          ? data.timestamp.toDate()
          : new Date(data.timestamp),
        userName: data.userName || "",
      } satisfies Movement;
    }
  );

  return { movements: data, loading, error };
}

