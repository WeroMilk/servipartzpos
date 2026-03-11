"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { storeStore } from "@/lib/storeStore";
import { useUserProfile } from "@/lib/hooks/useUserProfile";

interface StoreContextValue {
  storeId: string | null;
  storeName: string | null;
  profileLoaded: boolean;
  setStore: (storeId: string, storeName?: string) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { profile, loading: profileLoading } = useUserProfile();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState<string | null>(null);

  // Sincronizar tienda desde el perfil (persiste tras refresh)
  useEffect(() => {
    if (profile?.currentStoreId) {
      setStoreId(profile.currentStoreId);
      setStoreName(profile.currentStoreName ?? null);
      storeStore.setStore(profile.currentStoreId, profile.currentStoreName ?? undefined);
    }
  }, [profile?.currentStoreId, profile?.currentStoreName]);

  const setStore = useCallback((id: string, name?: string) => {
    setStoreId(id);
    setStoreName(name ?? null);
    storeStore.setStore(id, name);
  }, []);

  const value: StoreContextValue = {
    storeId,
    storeName,
    profileLoaded: !profileLoading,
    setStore,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    return {
      storeId: typeof window !== "undefined" ? storeStore.getStoreId() : null,
      storeName: typeof window !== "undefined" ? storeStore.getStoreName() : null,
      profileLoaded: true,
      setStore: (id: string, name?: string) => storeStore.setStore(id, name),
    };
  }
  return ctx;
}
