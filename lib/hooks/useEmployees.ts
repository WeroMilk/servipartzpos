"use client";

import { collection, query } from "firebase/firestore";
import { db, useFirebase } from "@/lib/firebase";
import { useRealtimeCollection } from "./useRealtimeCollection";

export interface Employee {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role?: "admin" | "cashier" | "manager" | "staff";
  status?: "active" | "inactive";
  createdAt?: Date;
  [key: string]: any;
}

export interface UseEmployeesResult {
  employees: Employee[];
  loading: boolean;
  error: Error | null;
}

/**
 * Hook para escuchar los empleados de una tienda en tiempo real.
 * Escucha la colección stores/{storeId}/employees
 */
export function useEmployees(storeId: string | null): UseEmployeesResult {
  const cloudEnabled = !!storeId && storeId !== "default" && useFirebase && !!db;

  const { data, loading, error } = useRealtimeCollection<Employee>(
    cloudEnabled,
    () => {
      if (!db) throw new Error("Firestore no inicializado");
      return query(collection(db, "stores", storeId!, "employees"));
    },
    (snap) => ({
      id: snap.id,
      ...snap.data(),
    } as Employee)
  );

  return { employees: data, loading, error };
}
