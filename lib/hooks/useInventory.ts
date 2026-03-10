"use client";

import { collection, query } from "firebase/firestore";
import { db, useFirebase } from "@/lib/firebase";
import type { Bottle, Product } from "@/lib/types";
import { useRealtimeCollection } from "./useRealtimeCollection";

export interface UseInventoryResult {
  bottles: Bottle[];
  loading: boolean;
  error: Error | null;
}

/**
 * Inventario en tiempo real de una tienda (products en Firestore).
 */
export function useInventory(storeId: string | null): UseInventoryResult {
  const cloudEnabled = !!storeId && storeId !== "default" && useFirebase && !!db;

  const { data, loading, error } = useRealtimeCollection<Bottle>(
    cloudEnabled,
    () => {
      if (!db) {
        throw new Error("Firestore no inicializado");
      }
      return query(collection(db, "stores", storeId!, "products"));
    },
    (snap) => {
      const data = snap.data() as Product;
      return {
        id: snap.id,
        name: data.name,
        category: data.category,
        size: 0,
        currentOz: 0,
        currentUnits: data.stock,
        price: data.price ?? 0,
        image: data.image,
      } satisfies Bottle;
    }
  );

  return { bottles: data, loading, error };
}

