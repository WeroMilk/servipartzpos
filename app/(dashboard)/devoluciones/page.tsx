"use client";

import { useState, useEffect } from "react";
import { RotateCcw, Search, Plus, Minus, Loader2, Lock, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/StoreContext";
import { loadInventory, saveInventory, addStockToProduct } from "@/lib/inventoryStorage";
import { DEFAULT_PRODUCTS } from "@/lib/productsData";
import { isMeasuredInUnits } from "@/lib/measurementRules";
import { movementsService, notificationsService } from "@/lib/movements";
import { addSaleRecord, getSaleByTicket } from "@/lib/salesRegistry";
import { auth } from "@/lib/auth";
import type { Bottle, SaleItem } from "@/lib/types";
import { useFirebase } from "@/lib/firebase";
import { addMovement as addMovementFirestore, addSaleRecordFirestore, getSaleByTicketFirestore, getStoreProducts, updateProductStock } from "@/lib/firestore";

interface ReturnItem {
  productId: string;
  name: string;
  quantity: number;
  maxQuantity: number;
  price?: number;
}

type Mode = "ticket" | "manual";

const DEVO_AUTH_KEY = "gabriel-devoluciones-authorized";

export default function DevolucionesPage() {
  const { storeId } = useStore();
  const isCloud = !!storeId && storeId !== "default" && useFirebase;
  const isLimited = auth.isLimitedUser();
  const [managerPassword, setManagerPassword] = useState("");
  const [managerPasswordError, setManagerPasswordError] = useState("");
  const [authorized, setAuthorized] = useState(() => {
    if (typeof window === "undefined") return false;
    return !!sessionStorage.getItem(DEVO_AUTH_KEY);
  });
  const [mode, setMode] = useState<Mode>("ticket");
  const [ticketSearch, setTicketSearch] = useState("");
  const [ticketResult, setTicketResult] = useState<ReturnItem[] | null>(null);
  const [ticketError, setTicketError] = useState("");
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [bottles, setBottles] = useState<Bottle[]>([]);
  const [search, setSearch] = useState("");
  const [processing, setProcessing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    if (isCloud) {
      getStoreProducts(storeId!)
        .then((prods) => {
          const mapped: Bottle[] = prods.map((p) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            size: 0,
            currentOz: 0,
            currentUnits: p.stock,
            price: p.price ?? 0,
            image: p.image,
          }));
          setBottles(mapped);
        })
        .catch(() => setBottles([]));
      return;
    }
    setBottles(loadInventory());
  }, [isCloud, storeId]);

  const handleManagerAuth = () => {
    if (auth.verifyManagerPassword(managerPassword)) {
      sessionStorage.setItem(DEVO_AUTH_KEY, "1");
      setAuthorized(true);
      setManagerPassword("");
      setManagerPasswordError("");
    } else {
      setManagerPasswordError("Contraseña incorrecta");
    }
  };

  const handleSearchTicket = async () => {
    const num = parseInt(ticketSearch.trim(), 10);
    if (isNaN(num) || !storeId) {
      setTicketError("Ingresa un número de ticket válido");
      setTicketResult(null);
      return;
    }
    const sale = isCloud ? await getSaleByTicketFirestore(storeId, num) : getSaleByTicket(storeId, num);
    if (!sale) {
      setTicketError("Ticket no encontrado");
      setTicketResult(null);
      return;
    }
    setTicketError("");
    setTicketResult(
      sale.items.map((item) => {
        const bottle = bottles.find((b) => b.id === item.productId);
        const useUnits = bottle ? isMeasuredInUnits(bottle.category) : true;
        const maxQty = useUnits
          ? (bottle?.currentUnits ?? 0) + item.quantity
          : Math.floor((bottle?.currentOz ?? 0) / 29.57) + item.quantity;
        return {
          productId: item.productId,
          name: item.name,
          quantity: 0,
          maxQuantity: item.quantity,
          price: item.price,
        };
      })
    );
    setReturnItems([]);
  };

  const addManualItem = (bottle: Bottle, qty: number) => {
    const useUnits = isMeasuredInUnits(bottle.category);
    const stock = useUnits
      ? (bottle.currentUnits ?? 0)
      : Math.floor((bottle.currentOz ?? 0) / 29.57);
    if (qty <= 0 || qty > stock) return;
    setReturnItems((prev) => {
      const existing = prev.find((p) => p.productId === bottle.id);
      if (existing) {
        const newQty = Math.min(existing.quantity + qty, stock);
        if (newQty === 0) return prev.filter((p) => p.productId !== bottle.id);
        return prev.map((p) =>
          p.productId === bottle.id ? { ...p, quantity: newQty, maxQuantity: stock } : p
        );
      }
      return [
        ...prev,
        {
          productId: bottle.id,
          name: bottle.name,
          quantity: qty,
          maxQuantity: stock,
          price: bottle.price,
        },
      ];
    });
  };

  const updateReturnQty = (productId: string, delta: number) => {
    const source = mode === "ticket" ? ticketResult : returnItems;
    if (!source) return;
    const item = source.find((i) => i.productId === productId);
    if (!item) return;
    setReturnItems((prev) => {
      const existing = prev.find((p) => p.productId === productId);
      const base = existing ?? { ...item, quantity: 0 };
      const newQty = Math.max(0, Math.min(base.quantity + delta, base.maxQuantity));
      if (newQty === 0) return prev.filter((p) => p.productId !== productId);
      if (existing) {
        return prev.map((p) =>
          p.productId === productId ? { ...p, quantity: newQty } : p
        );
      }
      return [...prev, { ...base, quantity: newQty }];
    });
  };

  const itemsToReturn =
    mode === "ticket"
      ? ticketResult?.map((t) => {
          const inCart = returnItems.find((r) => r.productId === t.productId);
          return inCart ? { ...t, quantity: inCart.quantity } : t;
        }) ?? []
      : returnItems;

  const totalToReturn = itemsToReturn.filter((i) => i.quantity > 0);
  const totalAmount = totalToReturn.reduce(
    (acc, i) => acc + (i.price ?? 0) * i.quantity,
    0
  );

  const handleConfirmReturn = async () => {
    if (totalToReturn.length === 0) {
      alert("Selecciona productos a devolver");
      return;
    }
    setProcessing(true);
    try {
      const sid = storeId ?? "default";
      const currentBottles = isCloud ? bottles : loadInventory();
      const saleItems: SaleItem[] = totalToReturn.map((i) => ({
        productId: i.productId,
        name: i.name,
        quantity: i.quantity,
        price: i.price,
      }));

      for (const item of totalToReturn) {
        const bottle = currentBottles.find((b) => b.id === item.productId);
        if (!bottle) continue;
        const useUnits = isMeasuredInUnits(bottle.category);
        if (isCloud) {
          const current = bottle.currentUnits ?? 0;
          const next = current + item.quantity;
          await updateProductStock(sid, item.productId, next, item.name);
          await addMovementFirestore(sid, {
            productId: item.productId,
            productName: item.name,
            type: "return",
            oldValue: current,
            newValue: next,
            userName: auth.getCurrentUser()?.name ?? "Sistema",
          });
        } else {
          addStockToProduct(item.productId, item.quantity, useUnits);
          movementsService.add({
            type: "return",
            bottleId: item.productId,
            bottleName: item.name,
            newValue: item.quantity,
            userName: auth.getCurrentUser()?.name ?? "Sistema",
            description: `Devolución: ${item.name} +${item.quantity} unid`,
          });
        }
      }
      if (!isCloud) notificationsService.incrementUnread();

      if (isCloud) {
        await addSaleRecordFirestore(sid, {
          ticketNumber: 0,
          storeId: sid,
          items: saleItems.map((s) => ({ ...s, quantity: -s.quantity })),
          total: -totalAmount,
          employeeName: auth.getCurrentUser()?.name,
          type: "return",
        });
      } else {
        addSaleRecord({
          ticketNumber: 0,
          storeId: sid,
          items: saleItems.map((s) => ({ ...s, quantity: -s.quantity })),
          total: -totalAmount,
          employeeName: auth.getCurrentUser()?.name,
          type: "return",
        });
      }

      setReturnItems([]);
      setTicketResult(null);
      setTicketSearch("");
      if (isCloud) {
        const prods = await getStoreProducts(sid);
        const mapped: Bottle[] = prods.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          size: 0,
          currentOz: 0,
          currentUnits: p.stock,
          price: p.price ?? 0,
          image: p.image,
        }));
        setBottles(mapped);
      } else {
        setBottles(loadInventory());
      }
      alert("Devolución registrada correctamente");
    } catch (e) {
      console.error(e);
      alert("Error al registrar la devolución");
    } finally {
      setProcessing(false);
    }
  };

  const filteredBottles = bottles.filter(
    (b) =>
      !search.trim() ||
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.id === search.trim()
  );

  // Vendedor (Gabriel): requiere contraseña del gerente (Zavala) para acceder
  if (isLimited && !authorized) {
    return (
      <div className="h-full min-h-0 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-amber-100">
            <Lock className="w-6 h-6 text-amber-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 text-center mb-2">
            Autorización requerida
          </h3>
          <p className="text-sm text-slate-600 text-center mb-4">
            Para registrar devoluciones necesitas la contraseña del gerente (Zavala).
          </p>
          <input
            type="password"
            placeholder="Contraseña del gerente"
            value={managerPassword}
            onChange={(e) => {
              setManagerPassword(e.target.value);
              setManagerPasswordError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleManagerAuth()}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl mb-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          {managerPasswordError && (
            <p className="text-sm text-red-600 mb-2">{managerPasswordError}</p>
          )}
          <button
            type="button"
            onClick={handleManagerAuth}
            className="w-full py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700"
          >
            Verificar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden">
      <div className="flex-shrink-0 px-4 pt-2 pb-1">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-primary-600" />
          Devoluciones
        </h2>
        <p className="text-xs text-slate-500">Registra devoluciones por ticket o manual</p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setMode("ticket");
              setTicketResult(null);
              setReturnItems([]);
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium ${
              mode === "ticket"
                ? "bg-primary-600 text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            Por ticket
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("manual");
              setTicketResult(null);
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium ${
              mode === "manual"
                ? "bg-primary-600 text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            Manual
          </button>
        </div>

        {mode === "ticket" && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Número de ticket
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                placeholder="Ej: 42"
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchTicket()}
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl"
              />
              <button
                type="button"
                onClick={handleSearchTicket}
                className="px-4 py-3 bg-primary-600 text-white font-medium rounded-xl"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
            {ticketError && (
              <p className="text-sm text-red-600">{ticketError}</p>
            )}
            {ticketResult && ticketResult.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium text-slate-700">
                  Productos del ticket (selecciona cantidades a devolver)
                </p>
                {ticketResult.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                  >
                    <span className="font-medium text-sm truncate flex-1 mr-2">
                      {item.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateReturnQty(item.productId, -1)
                        }
                        className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium">
                        {returnItems.find((r) => r.productId === item.productId)?.quantity ?? 0}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateReturnQty(item.productId, 1)
                        }
                        className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <span className="text-xs text-slate-500">
                        máx {item.maxQuantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {mode === "manual" && (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl"
            />
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filteredBottles.map((bottle) => {
                const useUnits = isMeasuredInUnits(bottle.category);
                const stock = useUnits
                  ? (bottle.currentUnits ?? 0)
                  : Math.floor((bottle.currentOz ?? 0) / 29.57);
                if (stock <= 0) return null;
                return (
                  <div
                    key={bottle.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50"
                  >
                    <span className="text-sm truncate flex-1">{bottle.name}</span>
                    <div className="flex gap-1">
                      {[1, 2, 5].map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => addManualItem(bottle, q)}
                          disabled={stock < q}
                          className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded hover:bg-primary-200 disabled:opacity-40"
                        >
                          +{q}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            {returnItems.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium text-slate-700">
                  Productos a devolver
                </p>
                {returnItems.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                  >
                    <span className="font-medium text-sm truncate flex-1 mr-2">
                      {item.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateReturnQty(item.productId, -1)
                        }
                        className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateReturnQty(item.productId, 1)
                        }
                        className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {totalToReturn.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex justify-between font-semibold mb-3">
              <span>Total a devolver</span>
              <span className="text-emerald-600">
                ${totalAmount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              disabled={processing}
              className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {processing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <RotateCcw className="w-5 h-5" />
              )}
              Confirmar devolución
            </button>
          </div>
        )}

        <AnimatePresence>
          {showConfirmModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              onClick={() => setShowConfirmModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Confirmar devolución</h3>
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(false)}
                    className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    aria-label="Cerrar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-slate-600 mb-6">
                  ¿Confirmas que el total a devolver es{" "}
                  <span className="font-bold text-slate-900">
                    ${totalAmount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </span>
                  ?
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 py-3 px-4 bg-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setShowConfirmModal(false);
                      await handleConfirmReturn();
                    }}
                    disabled={processing}
                    className="flex-1 py-3 px-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Aceptar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
