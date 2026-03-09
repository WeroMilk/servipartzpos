"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import AuthGuard from "@/components/Auth/AuthGuard";
import DashboardHeader from "@/components/Dashboard/DashboardHeader";
import DashboardFooter from "@/components/Dashboard/DashboardFooter";
import { ToastProvider } from "@/components/Toast/ToastContext";
import { notificationsService } from "@/lib/movements";
import { storeStore } from "@/lib/storeStore";
import { demoAuth } from "@/lib/demoAuth";
import { localStores } from "@/lib/localStores";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setUnreadCount(notificationsService.getUnreadCount());
    const handler = () => setUnreadCount(notificationsService.getUnreadCount());
    window.addEventListener("barra-notifications-update", handler);
    return () => window.removeEventListener("barra-notifications-update", handler);
  }, []);

  useEffect(() => {
    const skipStoreCheck = pathname === "/select-store" || pathname === "/stores" || pathname === "/report" || pathname === "/inventario" || pathname?.startsWith("/admin");
    // Vendedor (Gabriel): auto-asignar su tienda asignada si no tiene, para evitar bucle con /stores restringido
    if (demoAuth.isLimitedUser() && !storeStore.getStoreId()) {
      const user = demoAuth.getCurrentUser();
      const storeIds = user?.storeIds ?? ["default"];
      const storeId = storeIds[0] ?? "default";
      const stores = localStores.ensureDefault(user?.storeName ?? "Matriz");
      const store = stores.find((s) => s.id === storeId);
      const storeName = store?.name ?? (storeId === "default" ? user?.storeName ?? "Matriz" : storeId);
      storeStore.setStore(storeId, storeName);
    }
    if (!skipStoreCheck && !storeStore.getStoreId()) {
      router.replace("/stores");
    }
  }, [pathname, router]);

  // Usuario limitado (Gabriel): solo caja, inventario, turnos y devoluciones
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
    if (demoAuth.isLimitedUser() && pathname && restrictedForLimited.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
      router.replace("/caja");
    }
  }, [pathname, router]);

  return (
    <AuthGuard>
      <ToastProvider>
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
      </ToastProvider>
    </AuthGuard>
  );
}
