"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import AuthGuard from "@/components/Auth/AuthGuard";
import DashboardHeader from "@/components/Dashboard/DashboardHeader";
import DashboardFooter from "@/components/Dashboard/DashboardFooter";
import { ToastProvider } from "@/components/Toast/ToastContext";
import { StoreProvider, useStore } from "@/lib/StoreContext";
import { notificationsService } from "@/lib/movements";
import { auth } from "@/lib/auth";
import { getStore } from "@/lib/firestore";

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();
  const router = useRouter();
  const { storeId, profileLoaded, setStore } = useStore();

  useEffect(() => {
    setUnreadCount(notificationsService.getUnreadCount());
    const handler = () => setUnreadCount(notificationsService.getUnreadCount());
    window.addEventListener("barra-notifications-update", handler);
    return () => window.removeEventListener("barra-notifications-update", handler);
  }, []);

  // Solo redirigir cuando el perfil ya cargó y sigue sin haber tienda (evita desaparecer datos tras refresh)
  useEffect(() => {
    if (!profileLoaded) return;
    const skipStoreCheck = pathname === "/select-store" || pathname === "/stores" || pathname === "/report" || pathname === "/inventario" || pathname?.startsWith("/admin");
    if (auth.isLimitedUser() && !storeId) {
      const user = auth.getCurrentUser();
      const storeIds = user?.storeIds ?? [];
      const firstId = storeIds[0];
      if (firstId) {
        getStore(firstId).then((store) => {
          if (store) setStore(store.id, store.name);
        });
      }
    }
    if (!skipStoreCheck && !storeId) {
      router.replace(auth.isLimitedUser() ? "/select-store" : "/stores");
    }
  }, [pathname, router, profileLoaded, storeId, setStore]);

  // Usuario limitado (Gabriel): solo caja, inventario, turnos y devoluciones (devoluciones con contraseña gerente).
  const restrictedForLimited = [
    "/report",
    "/movements",
    "/import-order",
    "/config",
    "/cfdi",
    "/admin",
    "/stores",
    "/select-bottles",
  ];
  useEffect(() => {
    if (auth.isLimitedUser() && pathname && restrictedForLimited.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
      router.replace("/caja");
    }
  }, [pathname, router]);

  return (
    <div
      className="bg-slate-50 flex flex-col overflow-hidden w-full max-w-[100vw] safe-area-x"
      style={{
        height: "var(--app-height, 100dvh)",
        minHeight: "100dvh",
        maxHeight: "100dvh",
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <DashboardHeader notificationsCount={unreadCount} />
      <main className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {children}
      </main>
      <DashboardFooter />
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <StoreProvider>
        <ToastProvider>
          <DashboardLayoutInner>{children}</DashboardLayoutInner>
        </ToastProvider>
      </StoreProvider>
    </AuthGuard>
  );
}
