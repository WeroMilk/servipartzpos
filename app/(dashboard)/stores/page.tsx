"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Store,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  Loader2,
  LogIn,
  BarChart3,
  ShoppingCart,
  Package,
  DollarSign,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { useStore } from "@/lib/StoreContext";
import { useUserProfile } from "@/lib/hooks/useUserProfile";
import {
  getStores,
  createStore,
  updateStore,
  deleteStore,
  initStoreProducts,
} from "@/lib/firestore";
import type { Store as StoreType } from "@/lib/types";

export default function StoresPage() {
  const router = useRouter();
  const { setStore } = useStore();
  const { profile, loading: profileLoading } = useUserProfile();
  const [stores, setStores] = useState<StoreType[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editingStore, setEditingStore] = useState<StoreType | null>(null);
  const [formName, setFormName] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const isAdmin = profile?.role === "admin";
  const canManageStores = true;

  const loadStores = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const result = await getStores();
      // Todos ven las mismas tiendas (gerente y vendedores)
      setStores(result);
    } catch {
      setStores([]);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    if (profileLoading || !profile) return;
    loadStores();
  }, [profileLoading, profile, loadStores]);

  const handleAdd = async () => {
    if (!formName.trim()) return;
    setActionLoading(true);
    try {
      const store = await createStore(formName.trim(), formAddress.trim() || undefined);
      setStores((prev) => [...prev, store]);
      setModal(null);
      setFormName("");
      setFormAddress("");
      try {
        await initStoreProducts(store.id);
      } catch (eInit) {
        console.error("initStoreProducts:", eInit);
        alert("Tienda creada, pero no se pudieron cargar los productos por defecto. Añádelos desde Inventario.");
      }
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Error al crear tienda");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editingStore || !formName.trim()) return;
    setActionLoading(true);
    const updatedData = { name: formName.trim(), address: formAddress.trim() || undefined };
    try {
      await updateStore(editingStore.id, updatedData);
      setStores((prev) =>
        prev.map((s) =>
          s.id === editingStore.id ? { ...s, ...updatedData } : s
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

  const handleEnterStore = (store: StoreType) => {
    setStore(store.id, store.name);
    router.push("/caja");
  };

  const openEdit = (store: StoreType) => {
    setEditingStore(store);
    setFormName(store.name);
    setFormAddress(store.address || "");
    setModal("edit");
  };

  if (profileLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6">
        <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
        <p className="mt-4 text-slate-500">{profileLoading ? "Cargando perfil…" : "Cargando tiendas…"}</p>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden">
      <div className="flex-shrink-0 px-4 pt-2 pb-1 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link
            href="/config"
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600"
            aria-label="Volver"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Store className="w-5 h-5 text-primary-600" />
              Tiendas
            </h2>
            <p className="text-xs text-slate-500">
              Entra a una tienda para cobrar, ver ventas e inventario. Crea, edita o elimina tiendas según necesites.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm"
            >
              <BarChart3 className="w-4 h-4" />
              Modo gerente
            </Link>
          )}
          {canManageStores && (
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
              Crear tienda
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        {/* Acceso rápido: Reporte e Inventario de todas las tiendas */}
        <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto mb-4">
          <Link
            href="/report"
            className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 shadow-sm transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
              <BarChart3 className="w-5 h-5 text-primary-600" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 text-sm">Reporte de ventas</p>
              <p className="text-xs text-slate-500 truncate">Todas las tiendas</p>
            </div>
          </Link>
          <Link
            href="/inventario"
            className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 shadow-sm transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5 text-primary-600" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 text-sm">Inventario general</p>
              <p className="text-xs text-slate-500 truncate">Todas las tiendas</p>
            </div>
          </Link>
        </div>

        {stores.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Store className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-slate-500 mb-2">No hay tiendas</p>
            {canManageStores ? (
              <button
                type="button"
                onClick={() => {
                  setFormName("");
                  setFormAddress("");
                  setModal("add");
                }}
                className="px-4 py-2 bg-primary-600 text-white rounded-xl font-medium"
              >
                Crear primera tienda
              </button>
            ) : (
              <p className="text-sm text-slate-400">Contacta al administrador para crear tiendas.</p>
            )}
          </div>
        ) : (
          <div className="space-y-3 max-w-2xl mx-auto">
            {stores.map((store) => (
              <div
                key={store.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm"
              >
                <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900">{store.name}</p>
                    {store.address && (
                      <p className="text-xs text-slate-500 truncate mt-0.5">{store.address}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleEnterStore(store)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-medium text-sm"
                    >
                      <LogIn className="w-4 h-4" />
                      Entrar
                    </button>
                    {canManageStores && (
                      <>
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
                      </>
                    )}
                  </div>
                </div>
                <div className="px-4 pb-3 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <ShoppingCart className="w-3.5 h-3.5" /> Cobrar
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" /> Ventas
                  </span>
                  <span className="flex items-center gap-1">
                    <Package className="w-3.5 h-3.5" /> Inventario
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Crear */}
      {modal === "add" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Crear tienda</h3>
            <div className="space-y-3">
              <div>
                <label htmlFor="store-name-add" className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                <input
                  id="store-name-add"
                  name="storeName"
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej: SERVIPARTZ Hermosillo"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label htmlFor="store-address-add" className="block text-sm font-medium text-slate-700 mb-1">Dirección (opcional)</label>
                <input
                  id="store-address-add"
                  name="storeAddress"
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
                <label htmlFor="store-name-edit" className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                <input
                  id="store-name-edit"
                  name="storeName"
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej: SERVIPARTZ Hermosillo"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label htmlFor="store-address-edit" className="block text-sm font-medium text-slate-700 mb-1">Dirección (opcional)</label>
                <input
                  id="store-address-edit"
                  name="storeAddress"
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
    </div>
  );
}
