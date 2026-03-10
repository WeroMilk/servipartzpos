"use client";

import { useEffect, useState } from "react";
import type {
  Query,
  QuerySnapshot,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { onSnapshot } from "firebase/firestore";

export interface RealtimeCollectionResult<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
}

/**
 * Hook genérico para escuchar una colección o query en tiempo real.
 *
 * @param enabled Si es false, no se suscribe.
 * @param getQuery Función que devuelve un Query de Firestore.
 * @param mapDoc Función que mapea cada documento a tu tipo T.
 */
export function useRealtimeCollection<T>(
  enabled: boolean,
  getQuery: () => Query<DocumentData>,
  mapDoc: (doc: QueryDocumentSnapshot<DocumentData>) => T
): RealtimeCollectionResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let unsub: (() => void) | undefined;

    try {
      const q = getQuery();
      unsub = onSnapshot(
        q,
        (snap: QuerySnapshot<DocumentData>) => {
          const items = snap.docs.map(mapDoc);
          setData(items);
          setLoading(false);
        },
        (err) => {
          console.error("useRealtimeCollection error:", err);
          setError(err);
          setLoading(false);
        }
      );
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      console.error("useRealtimeCollection init error:", err);
      setError(err);
      setLoading(false);
    }

    return () => {
      if (unsub) unsub();
    };
  }, [enabled, getQuery, mapDoc]);

  return { data, loading, error };
}

