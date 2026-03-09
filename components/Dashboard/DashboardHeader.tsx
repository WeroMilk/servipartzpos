"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Package, Bell, Settings, DollarSign, PackageOpen, Menu, X, ShoppingCart, BarChart3, Store, Wifi, WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import LogoutButton from "@/components/Auth/LogoutButton";
import { demoAuth } from "@/lib/demoAuth";
import { storeStore } from "@/lib/storeStore";

interface DashboardHeaderProps {
  leftContent?: React.ReactNode;
  notificationsCount?: number;
}

const POS_NAV = { href: "/caja", icon: ShoppingCart, label: "Punto de venta" };

const NAV_ITEMS = [
  { href: "/inventario", icon: Package, label: "Inventario" },
  { href: "/movements", icon: Bell, label: "Movimientos" },
  { href: "/report", icon: DollarSign, label: "Reporte de ventas" },
  { href: "/import-order", icon: PackageOpen, label: "Importar pedido" },
  { href: "/config", icon: Settings, label: "Configuraciones" },
] as const;

const ADMIN_NAV = { href: "/admin", icon: BarChart3, label: "Panel gerente" };
const STORES_NAV = { href: "/stores", icon: Store, label: "Gestión de tiendas" };

export default function DashboardHeader({ leftContent, notificationsCount = 0 }: DashboardHeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const linkClass = (path: string) =>
    pathname === path ? "text-primary-600" : "text-slate-400 hover:text-white";

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-black/95 backdrop-blur-sm border-b border-white/5 flex-shrink-0 safe-area-x">
        <div className="flex items-center h-full relative min-h-[44px] sm:min-h-[56px] px-4 sm:px-6">
          {/* Logo / Título */}
          <div className="flex-1 flex items-center min-w-0">
            <Link href="/caja" title="Ir a Punto de venta" className="flex items-center gap-2 shrink-0">
              <span className="text-base sm:text-lg font-bold text-white tracking-tight">Servipartz</span>
              <span className="hidden sm:inline text-xs text-slate-400 truncate max-w-[120px]">
                {storeStore.getStoreName() || demoAuth.getCurrentUser()?.storeName || "Matriz"}
              </span>
            </Link>
          </div>

          {/* Móvil: hamburguesa */}
          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="touch-target-min flex items-center justify-center min-w-[44px] min-h-[44px] p-2 rounded-xl text-white hover:bg-white/10 transition-colors"
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5" strokeWidth={2} />
            </button>
          </div>

          {/* Desktop: navegación */}
          <nav className="hidden md:flex items-center gap-1">
            {leftContent}
            <Link
              href={POS_NAV.href}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                pathname === POS_NAV.href
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                  : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-md hover:shadow-lg"
              }`}
              title={POS_NAV.label}
              aria-label={POS_NAV.label}
            >
              <POS_NAV.icon className="w-5 h-5 flex-shrink-0" />
              <span>{POS_NAV.label}</span>
            </Link>
            {demoAuth.getCurrentUser()?.role === "admin" && (
              <>
                <Link
                  href={STORES_NAV.href}
                  className={`touch-target-min flex items-center justify-center min-w-[36px] min-h-[36px] p-1.5 rounded-lg transition-colors ${linkClass(STORES_NAV.href)}`}
                  title={STORES_NAV.label}
                  aria-label={STORES_NAV.label}
                >
                  <STORES_NAV.icon className="w-4 h-4 flex-shrink-0" />
                </Link>
                <Link
                  href={ADMIN_NAV.href}
                  className={`touch-target-min flex items-center justify-center min-w-[36px] min-h-[36px] p-1.5 rounded-lg transition-colors ${linkClass(ADMIN_NAV.href)}`}
                  title={ADMIN_NAV.label}
                  aria-label={ADMIN_NAV.label}
                >
                  <ADMIN_NAV.icon className="w-4 h-4 flex-shrink-0" />
                </Link>
              </>
            )}
            {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                className={`touch-target-min flex items-center justify-center min-w-[36px] min-h-[36px] p-1.5 rounded-lg transition-colors ${linkClass(href)}`}
                title={label}
                aria-label={label}
              >
                <span className="relative inline-flex">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {href === "/movements" && notificationsCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-0.5 flex items-center justify-center text-[8px] font-bold text-white bg-accent-red rounded-full">
                      {notificationsCount > 99 ? "99+" : notificationsCount}
                    </span>
                  )}
                </span>
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2 ml-2">
            <span
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${
                isOnline ? "text-emerald-400 bg-emerald-500/10" : "text-amber-400 bg-amber-500/10"
              }`}
              title={isOnline ? "Conectado" : "Sin conexión"}
            >
              {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              {isOnline ? "Conectado" : "Offline"}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Menú hamburguesa móvil */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              role="presentation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 bg-black/40 z-30 md:hidden backdrop-blur-[2px]"
              onClick={() => setMenuOpen(false)}
              aria-hidden
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed top-0 right-0 bottom-0 w-[min(100vw-56px,320px)] max-w-full bg-slate-900 border-l border-white/10 shadow-2xl z-40 flex flex-col md:hidden"
              style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
            >
              <div className="flex flex-col flex-shrink-0 border-b border-white/10">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm font-semibold text-white">Menú</span>
                  <button
                    type="button"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-center w-10 h-10 rounded-xl text-slate-400 hover:bg-white/10 transition-colors"
                    aria-label="Cerrar menú"
                  >
                    <X className="w-5 h-5" strokeWidth={2} />
                  </button>
                </div>
                {leftContent && <div className="px-4 pb-3 pt-1 border-t border-white/10">{leftContent}</div>}
              </div>
              <nav className="flex-1 overflow-y-auto py-2" aria-label="Navegación principal">
                <ul className="px-2 space-y-0.5">
                  <li>
                    <Link
                      href={POS_NAV.href}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-4 rounded-xl transition-colors ${
                        pathname === POS_NAV.href
                          ? "bg-emerald-500 text-white"
                          : "bg-emerald-500/90 text-white hover:bg-emerald-600"
                      }`}
                    >
                      <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/20">
                        <POS_NAV.icon className="w-6 h-6" strokeWidth={2} />
                      </span>
                      <span className="font-semibold text-[16px]">{POS_NAV.label}</span>
                    </Link>
                  </li>
                  {demoAuth.getCurrentUser()?.role === "admin" && (
                    <>
                      <li>
                        <Link
                          href={STORES_NAV.href}
                          onClick={() => setMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                            pathname === STORES_NAV.href ? "bg-primary-600/20 text-primary-400" : "text-slate-300 hover:bg-white/10"
                          }`}
                        >
                          <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/5">
                            <STORES_NAV.icon className="w-5 h-5" strokeWidth={2} />
                          </span>
                          <span className="font-medium text-[15px]">{STORES_NAV.label}</span>
                        </Link>
                      </li>
                      <li>
                        <Link
                          href={ADMIN_NAV.href}
                          onClick={() => setMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                            pathname === ADMIN_NAV.href ? "bg-primary-600/20 text-primary-400" : "text-slate-300 hover:bg-white/10"
                          }`}
                        >
                          <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/5">
                            <ADMIN_NAV.icon className="w-5 h-5" strokeWidth={2} />
                          </span>
                          <span className="font-medium text-[15px]">{ADMIN_NAV.label}</span>
                        </Link>
                      </li>
                    </>
                  )}
                  {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
                    const isActive = pathname === href;
                    return (
                      <li key={href}>
                        <Link
                          href={href}
                          onClick={() => setMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                            isActive ? "bg-primary-600/20 text-primary-400" : "text-slate-300 hover:bg-white/10"
                          }`}
                        >
                          <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/5">
                            <Icon className="w-5 h-5" strokeWidth={2} />
                          </span>
                          <span className="font-medium text-[15px]">{label}</span>
                          {href === "/movements" && notificationsCount > 0 && (
                            <span className="ml-auto min-w-[22px] h-[22px] px-1.5 flex items-center justify-center text-xs font-bold text-white bg-accent-red rounded-full">
                              {notificationsCount > 99 ? "99+" : notificationsCount}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
              <div className="flex-shrink-0 p-3 pt-2 border-t border-white/10 space-y-2">
                <div
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm ${
                    isOnline ? "text-emerald-400 bg-emerald-500/10" : "text-amber-400 bg-amber-500/10"
                  }`}
                >
                  {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                  {isOnline ? "Conectado" : "Sin conexión"}
                </div>
                <LogoutButton className="!min-h-[48px] w-full justify-center rounded-xl" showText alwaysShowText />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
