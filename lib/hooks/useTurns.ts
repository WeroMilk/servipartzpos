"use client";

import { useCallback, useMemo } from "react";
import { collection, query, orderBy } from "firebase/firestore";
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
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
 * getQuery y mapDoc estables por storeId para no re-suscribir en cada render.
 */
export function useTurns(storeId: string | null): UseTurnsResult {
  const cloudEnabled = !!storeId && storeId !== "default" && useFirebase && !!db;

  const getQuery = useCallback(() => {
    if (!db || !storeId) throw new Error("Firestore o storeId no disponible");
    return query(
      collection(db, "stores", storeId, "shifts"),
      orderBy("openedAt", "desc")
    );
  }, [storeId]);

  const mapDoc = useCallback((snap: QueryDocumentSnapshot<DocumentData>): Shift => {
    const data = snap.data() as Record<string, unknown>;
    const toDate = (v: unknown): Date => {
      if (v && typeof v === "object" && "toDate" in v && typeof (v as { toDate: () => Date }).toDate === "function") {
        return (v as { toDate: () => Date }).toDate();
      }
      return v ? new Date(v as string) : new Date();
    };
    return {
      id: snap.id,
      storeId: (data.storeId as string) ?? storeId ?? "",
      employeeId: (data.employeeId as string) ?? "",
      employeeName: (data.employeeName as string) ?? "",
      openedAt: toDate(data.openedAt),
      closedAt: data.closedAt ? toDate(data.closedAt) : undefined,
      initialCash: (data.initialCash as number) ?? 0,
      status: (data.status as "open" | "closed") ?? "open",
    };
  }, [storeId]);

  const { data, loading, error } = useRealtimeCollection<Shift>(cloudEnabled, getQuery, mapDoc);

  const currentShift = useMemo(() => data.find((s) => s.status === "open") ?? null, [data]);
  const closedShifts = useMemo(() => data.filter((s) => s.status === "closed"), [data]);

  return { turns: data, currentShift, closedShifts, loading, error };
}

