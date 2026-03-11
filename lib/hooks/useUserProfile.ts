"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { auth as firebaseAuth, db, useFirebase } from "@/lib/firebase";
import type { UserProfile } from "@/lib/firestore";
import { storeStore } from "@/lib/storeStore";
import { auth } from "@/lib/auth";

interface UseUserProfileResult {
  profile: UserProfile | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Escucha en tiempo real el perfil del usuario (users/{uid}).
 * Mantiene sincronizado currentStore en todos los dispositivos.
 */
export function useUserProfile(): UseUserProfileResult {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(useFirebase);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!firebaseAuth?.currentUser || !db) {
      setLoading(false);
      return;
    }

    const uid = firebaseAuth.currentUser.uid;
    const ref = doc(db, "users", uid);

    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setProfile(null);
          setLoading(false);
          return;
        }
        const data = snap.data() as any;
        const p: UserProfile = {
          email: data.email || "",
          name: data.name,
          role: data.role || "store_user",
          storeIds: data.storeIds || [],
          currentStoreId: data.currentStoreId,
          currentStoreName: data.currentStoreName,
          storeName: data.storeName,
        };
        setProfile(p);
        setLoading(false);

        // Actualizar perfil en memoria y tienda actual (sincronizada entre dispositivos)
        auth.setProfile(p);
        if (p.currentStoreId) {
          storeStore.setStore(p.currentStoreId, p.currentStoreName);
        }
      },
      (err) => {
        console.error("useUserProfile error:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  return { profile, loading, error };
}

