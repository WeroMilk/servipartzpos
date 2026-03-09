"use client";

import { useState, useEffect } from "react";
import { getLastSaleImport, LAST_SALE_IMPORT_EVENT } from "@/lib/lastSaleImport";
import { getLastInventoryComplete, LAST_INVENTORY_COMPLETE_EVENT } from "@/lib/lastInventoryComplete";

export default function DashboardFooter() {
  const [lastSale, setLastSale] = useState("—");
  const [lastInventory, setLastInventory] = useState("—");

  useEffect(() => {
    const updateSale = () => setLastSale(getLastSaleImport());
    updateSale();
    window.addEventListener(LAST_SALE_IMPORT_EVENT, updateSale);
    return () => window.removeEventListener(LAST_SALE_IMPORT_EVENT, updateSale);
  }, []);

  useEffect(() => {
    const updateInv = () => setLastInventory(getLastInventoryComplete());
    updateInv();
    window.addEventListener(LAST_INVENTORY_COMPLETE_EVENT, updateInv);
    return () => window.removeEventListener(LAST_INVENTORY_COMPLETE_EVENT, updateInv);
  }, []);

  return (
    <div className="bg-slate-900 border-t border-white/10 px-2 py-1 sm:px-3 sm:py-1.5 flex-shrink-0">
      <div className="relative flex flex-row items-center justify-between gap-1 text-[8px] sm:text-[10px] text-slate-400 min-h-[24px]">
        {/* Izquierda (móvil y desktop): Último reporte de ventas */}
        <div className="flex items-center gap-1 min-w-0 truncate flex-1 justify-start">
          <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-emerald-500 rounded-full animate-pulse flex-shrink-0" />
          <span className="truncate">Último reporte de ventas: {lastSale}</span>
        </div>
        {/* Centro (solo desktop): Último inventario, centrado en la página */}
        <span className="hidden md:inline absolute left-1/2 -translate-x-1/2 text-center whitespace-nowrap pointer-events-none">
          Último inventario: {lastInventory}
        </span>
        {/* Derecha (móvil y desktop): Tiempo real */}
        <span className="text-slate-500 flex-shrink-0 flex-1 flex justify-end">Tiempo real</span>
      </div>
    </div>
  );
}
