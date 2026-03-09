"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Store,
  Plus,
  Pencil,
  Trash2,
  Eye,
  LayoutDashboard,
  Loader2,
  X,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import { demoAuth } from "@/lib/demoAuth";
import { useFirebase } from "@/lib/firebase";
import {
  getStores,
  createStore,
  updateStore,
  deleteStore,
  initStoreProducts,
  getStoreSales,
  getStoreProducts,
} from "@/lib/firestore";
import type { Store as StoreType } from "@/lib/types";

export default function AdminStoresPage() {
  const router = useRouter();
  const [stores, setStores] = useState<StoreType[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [modal, setModal] = useState<"add" | "edit" | "view" | null>(null);
  const [editingStore, setEditingStore] = useState<StoreType | null>(null);
  const [formName, setFormName] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [viewStore, setViewStore] = useState<StoreType | null>(null);
  const [viewStats, setViewStats] = useState<{ sales: number; products: number } | null>(null);

  useEffect(() => {
    if (demoAuth.getCurrentUser()?.role !== "admin") {
      router.replace("/inventario");
      return;
    }
    loadStores();
  }, [router]);

  const loadStores = async () => {
    if (!useFirebase) {
      setLoading(false);
      return;
    }
    try {
      const all = await getStores();
      setStores(all);
    } catch {
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!formName.trim() || !useFirebase) return;
    setActionLoading(true);
    try {
      const store = await createStore(formName.trim(), formAddress.trim() || undefined);
      await initStoreProducts(store.id);
      setStores((prev) => [...prev, store]);
      setModal(null);
      setFormName("");
      setFormAddress("");
    } catch (e) {
      console.error(e);
      alert("Error al crear tienda");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editingStore || !formName.trim() || !useFirebase) return;
    setActionLoading(true);
    try {
      await updateStore(editingStore.id, {
        name: formName.trim(),
        address: formAddress.trim() || undefined,
      });
      setStores((prev) =>
        prev.map((s) =>
          s.id === editingStore.id
            ? { ...s, name: formName.trim(), address: formAddress.trim() || undefined }
            : s
        )
      );
      setModal(null);
      setEditingStore(null);
      setFormName("");
      setFormAddress("");
    } catch (e) {
      console.error(e);
      alert("Error al actualizar tienda");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (store: StoreType) => {
    if (!confirm(`¿Eliminar la tienda "${store.name}"? Se borrarán todos los productos, ventas y movimientos.`))
      return;
    if (!useFirebase) return;
    setActionLoading(true);
    try {
      await deleteStore(store.id);
      setStores((prev) => prev.filter((s) => s.id !== store.id));
    } catch (e) {
      console.error(e);
      alert("Error al eliminar tienda");
    } finally {
      setActionLoading(false);
    }
  };

  const openEdit = (store: StoreType) => {
    setEditingStore(store);
    setFormName(store.name);
    setFormAddress(store.address || "");
    setModal("edit");
  };

  const openView = async (store: StoreType) => {
    setViewStore(store);
    setViewStats(null);
    setModal("view");
    if (useFirebase) {
      try {
        const [sales, products] = await Promise.all([
          getStoreSales(store.id, 30),
          getStoreProducts(store.id),
        ]);
        const totalSales = sales.reduce((acc, s) => acc + s.total, 0);
        setViewStats({ sales: totalSales, products: products.length });
      } catch {
        setViewStats({ sales: 0, products: 0 });
      }
    }
  };

  if (demoAuth.getCurrentUser()?.role !== "admin") return null;

  if (!useFirebase) {
    return (
      <div className="h-full min-h-0 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 px-4 pt-2 pb-1 flex items-center gap-2">
          <Link
            href="/admin"
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600"
            aria-label="Volver"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h2 className="text-lg font-semibold text-slate-900">Gestión de tiendas</h2>
        </div>
        <div className="flex-1 p-4">
          <p className="text-slate-500 text-center py-8">
            La gestión de tiendas requiere Firebase. Configura Firebase para usar esta función.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden">
      <div className="flex-shrink-0 px-4 pt-2 pb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600"
            aria-label="Volver"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Store className="w-5 h-5 text-primary-600" />
              Gestión de tiendas
            </h2>
            <p className="text-xs text-slate-500">Agregar, editar, eliminar y ver tiendas</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setFormName("");
            setFormAddress("");
            setModal("add");
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Agregar tienda
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
            <p className="mt-4 text-slate-500">Cargando tiendas...</p>
          </div>
        ) : (
          <div className="space-y-2">
            {stores.map((store) => (
              <div
                key={store.id}
                className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{store.name}</p>
                  {store.address && (
                    <p className="text-xs text-slate-500 truncate mt-0.5">{store.address}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openView(store)}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                    title="Ver tienda"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(store)}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                    title="Editar tienda"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(store)}
                    disabled={actionLoading}
                    className="p-2 rounded-lg hover:bg-red-50 text-red-600 disabled:opacity-50"
                    title="Eliminar tienda"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <Link
                    href={`/report?store=${store.id}`}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                    title="Ver reporte"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
            {stores.length === 0 && (
              <p className="text-center text-slate-500 py-12">
                No hay tiendas. Haz clic en &quot;Agregar tienda&quot; para crear una.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Modal Agregar */}
      {modal === "add" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Agregar tienda</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej: Servipartz Hermosillo"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Dirección (opcional)</label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Calle, número, colonia..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAdd}
                disabled={!formName.trim() || actionLoading}
                className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {modal === "edit" && editingStore && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Editar tienda</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej: Servipartz Hermosillo"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Dirección (opcional)</label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Calle, número, colonia..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                type="button"
                onClick={() => {
                  setModal(null);
                  setEditingStore(null);
                }}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleEdit}
                disabled={!formName.trim() || actionLoading}
                className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver */}
      {modal === "view" && viewStore && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Ver tienda</h3>
              <button
                type="button"
                onClick={() => {
                  setModal(null);
                  setViewStore(null);
                  setViewStats(null);
                }}
                className="p-2 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-slate-900">{viewStore.name}</p>
              {viewStore.address && (
                <p className="text-sm text-slate-500">{viewStore.address}</p>
              )}
            </div>
            {viewStats !== null && (
              <div className="mt-4 p-4 bg-slate-50 rounded-xl space-y-2">
                <p className="text-sm text-slate-600">
                  Ventas (30 días): ${viewStats.sales.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-slate-600">Productos: {viewStats.products}</p>
              </div>
            )}
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setModal(null);
                  setViewStore(null);
                  setViewStats(null);
                }}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50"
              >
                Cerrar
              </button>
              <Link
                href={`/report?store=${viewStore.id}`}
                className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 text-center font-medium"
              >
                Ver reporte
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
