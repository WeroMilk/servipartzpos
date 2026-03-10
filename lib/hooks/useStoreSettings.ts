"use client";

import { doc, onSnapshot } from "firebase/firestore";
import { db, useFirebase } from "@/lib/firebase";
import { useEffect, useState } from "react";

export interface StoreSettings {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  taxRate?: number;
  paymentMethods?: string[];
  printFormat?: string;
  [key: string]: any;
}

export interface UseStoreSettingsResult {
  settings: StoreSettings | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook para escuchar la configuración de la tienda en tiempo real.
 * Escucha el documento stores/{storeId}/settings/config
 */
export function useStoreSettings(storeId: string | null): UseStoreSettingsResult {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!storeId || storeId === "default" || !useFirebase || !db) {
      setLoading(false);
      setSettings(null);
      return;
    }

    const ref = doc(db, "stores", storeId, "settings", "config");
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setSettings(snap.data() as StoreSettings);
        } else {
          setSettings(null);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("useStoreSettings error:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    );

    return () => unsub();
  }, [storeId]);

  return { settings, loading, error };
}
