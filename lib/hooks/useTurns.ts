"use client";

import { collection, query, orderBy } from "firebase/firestore";
import { db, useFirebase } from "@/lib/firebase";
import type { Shift } from "@/lib/shiftService";
import { useRealtimeCollection } from "./useRealtimeCollection";

export interface UseTurnsResult {
  turns: Shift[];
  currentShift: Shift | null;
  closedShifts: Shift[];
  loading: boolean;
  error: Error | null;
}

/**
 * Turnos (shifts) en tiempo real para una tienda.
 */
export function useTurns(storeId: string | null): UseTurnsResult {
  const cloudEnabled = !!storeId && storeId !== "default" && useFirebase && !!db;

  const { data, loading, error } = useRealtimeCollection<Shift>(
    cloudEnabled,
    () => {
      if (!db) {
        throw new Error("Firestore no inicializado");
      }
      return query(
        collection(db, "stores", storeId!, "shifts"),
        orderBy("openedAt", "desc")
      );
    },
    (snap) => {
      const data = snap.data() as any;
      return {
        id: snap.id,
        storeId: data.storeId ?? storeId!,
        employeeId: data.employeeId ?? "",
        employeeName: data.employeeName ?? "",
        openedAt: data.openedAt?.toDate
          ? data.openedAt.toDate()
          : new Date(data.openedAt),
        closedAt: data.closedAt
          ? data.closedAt.toDate
            ? data.closedAt.toDate()
            : new Date(data.closedAt)
          : undefined,
        initialCash: data.initialCash ?? 0,
        status: data.status ?? "open",
      } satisfies Shift;
    }
  );

  const currentShift = data.find((s) => s.status === "open") ?? null;
  const closedShifts = data.filter((s) => s.status === "closed");

  return { turns: data, currentShift, closedShifts, loading, error };
}

