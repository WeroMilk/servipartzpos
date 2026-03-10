"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Store, LayoutDashboard } from "lucide-react";
import { demoAuth } from "@/lib/demoAuth";
import { useFirebase } from "@/lib/firebase";
import { getStores, setUserProfile } from "@/lib/firestore";
import { storeStore } from "@/lib/storeStore";
import type { Store as StoreType } from "@/lib/types";
import { auth } from "@/lib/firebase";

export default function SelectStorePage() {
  const router = useRouter();
  const [stores, setStores] = useState<StoreType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = demoAuth.getCurrentUser();
    const storeIds = user?.storeIds ?? ["default"];

    if (storeIds.length === 1 && storeIds[0] === "default") {
      storeStore.setStore("default", user?.storeName || "Matriz");
      router.replace("/caja");
      return;
    }

    if (useFirebase) {
      getStores()
        .then((all) => {
          const filtered =
            demoAuth.isAdminUser()
              ? all
              : all.filter((s) => storeIds.includes(s.id));
          setStores(filtered);
          if (filtered.length === 1) {
            storeStore.setStore(filtered[0].id, filtered[0].name);
            router.replace("/caja");
          }
        })
        .catch(() => setStores([]))
        .finally(() => setLoading(false));
    } else {
      setStores(
        storeIds.map((id) => ({
          id,
          name: id === "default" ? (user?.storeName || "Matriz") : id,
          createdAt: new Date(),
        }))
      );
      setLoading(false);
    }
  }, [router]);

  const handleSelect = (store: StoreType) => {
    storeStore.setStore(store.id, store.name);
    // Guardar tienda actual en el perfil para sincronizar entre dispositivos
    if (useFirebase && auth?.currentUser) {
      setUserProfile(auth.currentUser.uid, {
        currentStoreId: store.id,
        currentStoreName: store.name,
      }).catch(() => {
        /* ignore */
      });
    }
    router.push(demoAuth.isLimitedUser() ? "/caja" : "/inventario");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6">
        <div className="w-10 h-10 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-slate-500">Cargando tiendas...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-0 overflow-auto p-4 sm:p-6">
      <div className="max-w-md mx-auto w-full">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
            <Store className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Seleccionar tienda</h2>
            <p className="text-sm text-slate-500">Elige la tienda con la que trabajarás</p>
          </div>
        </div>

        <div className="space-y-2">
          {stores.map((store) => (
            <button
              key={store.id}
              onClick={() => handleSelect(store)}
              className="w-full flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-primary-300 transition-colors text-left"
            >
              <LayoutDashboard className="w-5 h-5 text-slate-400" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 truncate">{store.name}</p>
                {store.address && (
                  <p className="text-xs text-slate-500 truncate">{store.address}</p>
                )}
              </div>
            </button>
          ))}
        </div>

        {stores.length === 0 && (
          <p className="text-center text-slate-500 py-8">
            No hay tiendas disponibles. Contacta al administrador.
          </p>
        )}
      </div>
    </div>
  );
}
