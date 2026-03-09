"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, Store, DollarSign, TrendingUp } from "lucide-react";
import { demoAuth } from "@/lib/demoAuth";
import { useFirebase } from "@/lib/firebase";
import { getStores, getAllStoresSales } from "@/lib/firestore";
import { getSalesStats } from "@/lib/salesReport";
import type { Store as StoreType } from "@/lib/types";

interface StoreSalesSummary {
  storeId: string;
  storeName: string;
  totalSales: number;
  saleCount: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [stores, setStores] = useState<StoreType[]>([]);
  const [summaries, setSummaries] = useState<StoreSalesSummary[]>([]);
  const [globalTotal, setGlobalTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (demoAuth.getCurrentUser()?.role !== "admin") {
      router.replace("/inventario");
      return;
    }

    if (useFirebase) {
      getStores()
        .then(async (allStores) => {
          setStores(allStores);
          const storeIds = allStores.map((s) => s.id);
          const results = await getAllStoresSales(storeIds, 30);
          const sums: StoreSalesSummary[] = [];
          let total = 0;
          for (const { storeId, sales } of results) {
            const store = allStores.find((s) => s.id === storeId);
            const saleTotal = sales.reduce((acc, s) => acc + s.total, 0);
            sums.push({
              storeId,
              storeName: store?.name ?? storeId,
              totalSales: saleTotal,
              saleCount: sales.length,
            });
            total += saleTotal;
          }
          setSummaries(sums);
          setGlobalTotal(total);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      const stats = getSalesStats();
      const storeName = demoAuth.getCurrentUser()?.storeName ?? "Tienda principal";
      setSummaries([
        {
          storeId: "default",
          storeName,
          totalSales: stats.monthRevenue,
          saleCount: 0,
        },
      ]);
      setGlobalTotal(stats.monthRevenue);
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] p-6">
        <div className="w-10 h-10 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-slate-500">Cargando panel...</p>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden">
      <div className="flex-shrink-0 px-4 pt-2 pb-1">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary-600" />
          Panel gerente
        </h2>
        <p className="text-xs text-slate-500">Ventas globales de todas las tiendas</p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {/* Total global */}
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-5 h-5 text-primary-600" />
            <span className="text-sm font-medium text-primary-800">Total (30 días)</span>
          </div>
          <p className="text-2xl font-bold text-primary-700">
            {useFirebase
              ? `$${globalTotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`
              : globalTotal.toLocaleString("es-MX", { maximumFractionDigits: 1 }) + " unid."}
          </p>
        </div>

        {/* Por tienda */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
            <Store className="w-4 h-4" />
            Por tienda
          </h3>
          <div className="space-y-2">
            {summaries.map((s) => (
              <div
                key={s.storeId}
                className="bg-white rounded-xl border border-slate-200 p-3 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-slate-900">{s.storeName}</p>
                  <p className="text-xs text-slate-500">{s.saleCount} ventas</p>
                </div>
                <p className="font-semibold text-primary-600">
                  {useFirebase
                    ? `$${s.totalSales.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`
                    : s.totalSales.toLocaleString("es-MX", { maximumFractionDigits: 1 }) + " unid."}
                </p>
              </div>
            ))}
          </div>
        </div>

        {summaries.length === 0 && (
          <p className="text-center text-slate-500 py-8">
            No hay datos de ventas. Las ventas aparecerán aquí cuando se registren.
          </p>
        )}
      </div>
    </div>
  );
}
