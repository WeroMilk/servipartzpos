"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Search, Plus, Minus, Trash2, ShoppingCart, Loader2, Package, Percent, DollarSign, Clock, AlertCircle, Lock } from "lucide-react";
import { storeStore } from "@/lib/storeStore";
import { loadInventory as loadInventoryFromStorage, saveInventory } from "@/lib/inventoryStorage";
import { DEFAULT_PRODUCTS } from "@/lib/productsData";
import { isMeasuredInUnits } from "@/lib/measurementRules";
import { movementsService } from "@/lib/movements";
import { addSalesFromImport } from "@/lib/salesReport";
import { addSaleRecord, getProductSalesCounts } from "@/lib/salesRegistry";
import { getCurrentShift } from "@/lib/shiftService";
import { processQueue } from "@/lib/syncQueue";
import { setLastSaleImport } from "@/lib/lastSaleImport";
import { demoAuth } from "@/lib/demoAuth";
import { employeeAuth } from "@/lib/employeeAuth";
import { getNextTicketNumber } from "@/lib/ticketCounter";
import { getProductImageUrl } from "@/lib/productImages";
import PaymentModal from "@/components/Caja/PaymentModal";
import TicketPreview from "@/components/Caja/TicketPreview";
import type { Bottle, PaymentMethod } from "@/lib/types";
import type { SaleItem } from "@/lib/types";
import type { TicketData } from "@/lib/ticketService";

interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price?: number;
  unit?: string;
}

export default function CajaPage() {
  const storeId = typeof window !== "undefined" ? storeStore.getStoreId() : null;
  const [bottles, setBottles] = useState<Bottle[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [ticketData, setTicketData] = useState<TicketData | null>(null);
  const [discountPercent, setDiscountPercent] = useState<string>("");
  const [discountAmount, setDiscountAmount] = useState<string>("");
  const [hasOpenShift, setHasOpenShift] = useState(false);
  const [discountUnlocked, setDiscountUnlocked] = useState(false);
  const [showDiscountPasswordModal, setShowDiscountPasswordModal] = useState(false);
  const [discountPassword, setDiscountPassword] = useState("");
  const [discountPasswordError, setDiscountPasswordError] = useState("");

  const checkShift = useCallback(() => {
    if (storeId) {
      setHasOpenShift(!!getCurrentShift(storeId));
    } else {
      setHasOpenShift(!!getCurrentShift("default"));
    }
  }, [storeId]);

  useEffect(() => {
    checkShift();
  }, [checkShift]);

  useEffect(() => {
    const onFocus = () => checkShift();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [checkShift]);

  const refreshData = useCallback(() => {
    setBottles(loadInventoryFromStorage());
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    const syncPending = () => {
      processQueue().then((n) => {
        if (n > 0) refreshData();
      });
    };
    if (navigator.onLine) syncPending();
    window.addEventListener("online", syncPending);
    return () => window.removeEventListener("online", syncPending);
  }, [refreshData]);

  const items = bottles.map((b) => {
    const useUnits = isMeasuredInUnits(b.category);
    const stock = useUnits
      ? (b.currentUnits ?? 0)
      : Math.floor((b.currentOz ?? 0) / 29.57);
    const prod = DEFAULT_PRODUCTS.find((p) => p.id === b.id);
    return { id: b.id, name: b.name, stock, price: b.price ?? 0, sku: prod?.sku, barcode: prod?.barcode };
  });

  const salesCounts = getProductSalesCounts(storeId ?? "default");
  const filtered = items
    .filter(
      (i) =>
        !search.trim() ||
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        i.sku?.toLowerCase().includes(search.toLowerCase()) ||
        i.barcode?.toLowerCase().includes(search.toLowerCase()) ||
        i.id === search.trim()
    )
    .sort((a, b) => (salesCounts[b.id] ?? 0) - (salesCounts[a.id] ?? 0));

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const code = search.trim();
    if (!code) return;
    const match = items.find(
      (i) =>
        i.id === code ||
        i.sku?.toLowerCase() === code.toLowerCase() ||
        i.barcode?.toLowerCase() === code.toLowerCase()
    );
    if (match && match.stock > 0) {
      addToCart(match);
      setSearch("");
      e.preventDefault();
    }
  };

  const addToCart = (item: (typeof items)[0], qty = 1) => {
    const stock = item.stock;
    if (stock < qty) return;
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      const newQty = (existing?.quantity ?? 0) + qty;
      if (newQty > stock) return prev;
      if (existing) {
        return prev.map((c) => (c.id === item.id ? { ...c, quantity: newQty } : c));
      }
      return [...prev, { id: item.id, name: item.name, quantity: qty, price: item.price }];
    });
  };

  const updateCartQty = (id: string, delta: number) => {
    setCart((prev) => {
      const item = prev.find((c) => c.id === id);
      if (!item) return prev;
      const newQty = Math.max(0, item.quantity + delta);
      if (newQty === 0) return prev.filter((c) => c.id !== id);
      return prev.map((c) => (c.id === id ? { ...c, quantity: newQty } : c));
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((c) => c.id !== id));
  };

  const subtotalBeforeDiscount = cart.reduce((acc, c) => acc + (c.price ?? 0) * c.quantity, 0);
  const discountTotal =
    discountPercent.trim() !== ""
      ? Math.min(subtotalBeforeDiscount * (parseFloat(discountPercent.replace(",", ".")) || 0) / 100, subtotalBeforeDiscount)
      : discountAmount.trim() !== ""
        ? Math.min(parseFloat(discountAmount.replace(",", ".")) || 0, subtotalBeforeDiscount)
        : 0;
  const total = Math.max(0, subtotalBeforeDiscount - discountTotal);

  const clearDiscount = () => {
    setDiscountPercent("");
    setDiscountAmount("");
  };

  const handleDiscountSectionClick = () => {
    if (!discountUnlocked) {
      setShowDiscountPasswordModal(true);
      setDiscountPassword("");
      setDiscountPasswordError("");
    }
  };

  const handleDiscountPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const employee = employeeAuth.validate(discountPassword);
    if (!employee) {
      setDiscountPasswordError("Contraseña incorrecta");
      return;
    }
    if (employee.id !== "Gerente") {
      setDiscountPasswordError("Solo el gerente (Zavala) puede autorizar descuentos");
      return;
    }
    setDiscountUnlocked(true);
    setShowDiscountPasswordModal(false);
    setDiscountPassword("");
    setDiscountPasswordError("");
  };

  const processSaleWithPayment = async (payment: {
    method?: PaymentMethod;
    payments?: { method: PaymentMethod; amount: number }[];
    amountReceived?: number;
    change?: number;
  }) => {
    const cartToProcess = [...cart];
    if (cartToProcess.length === 0) return;
    // Vaciar carrito de inmediato para evitar doble cobro si el usuario hace doble clic
    setCart([]);
    clearDiscount();
    setDiscountUnlocked(false);
    setShowPaymentModal(false);
    setProcessing(true);
    const saleItems: SaleItem[] = cartToProcess.map((c) => ({
      productId: c.id,
      name: c.name,
      quantity: c.quantity,
      price: c.price,
    }));
    const ticketNumber = getNextTicketNumber(storeId ?? "default");
    const saleDate = new Date();

    try {
      const currentBottles = loadInventoryFromStorage();
      const applied = cartToProcess.map((c) => {
        const bottle = currentBottles.find((b) => b.id === c.id);
        if (!bottle) return null;
        const useUnits = isMeasuredInUnits(bottle.category);
        const idx = currentBottles.findIndex((b) => b.id === c.id);
        if (idx === -1) return null;
        const b = currentBottles[idx];
        if (useUnits) {
          const curr = b.currentUnits ?? 0;
          const toDeduct = c.quantity;
          const newVal = Math.max(0, curr - toDeduct);
          currentBottles[idx] = { ...b, currentUnits: newVal };
          return { bottleName: b.name, deducted: curr - newVal, unit: "units" as const };
        } else {
          const currOz = (b.currentOz ?? 0) / 29.57;
          const toDeductOz = c.quantity;
          const newOz = Math.max(0, currOz - toDeductOz);
          currentBottles[idx] = { ...b, currentOz: newOz * 29.57 };
          return { bottleName: b.name, deducted: toDeductOz, unit: "oz" as const };
        }
      }).filter(Boolean) as { bottleName: string; deducted: number; unit: "oz" | "units" }[];
      saveInventory(currentBottles);
      addSalesFromImport(
        saleItems.map((s) => ({ name: s.name, quantity: s.quantity, price: s.price })),
        saleDate,
        discountTotal > 0 ? total : undefined
      );
      applied.forEach((a) => {
        movementsService.add({
          type: "sales_import",
          bottleId: "_",
          bottleName: a.bottleName,
          newValue: a.deducted,
          userName: demoAuth.getCurrentUser()?.name ?? "Caja",
          description: `Venta: ${a.bottleName} -${a.deducted} ${a.unit}`,
        });
      });

      setLastSaleImport();
      const payments = payment.payments ?? [];
      const currentShift = getCurrentShift(storeId ?? "default");
      addSaleRecord({
        ticketNumber,
        storeId: storeId ?? "default",
        shiftId: currentShift?.id,
        items: saleItems,
        total,
        subtotalBeforeDiscount: discountTotal > 0 ? subtotalBeforeDiscount : undefined,
        discountTotal: discountTotal > 0 ? discountTotal : undefined,
        payments: payments.length ? payments : undefined,
        paymentMethod: payments.length ? undefined : payment.method,
        amountReceived: payment.amountReceived,
        change: payment.change,
        employeeName: demoAuth.getCurrentUser()?.name,
        type: "sale",
      });
      const paymentMethod = payments.length ? payments[0].method : payment.method ?? "efectivo";
      setTicketData({
        items: saleItems,
        total,
        ticketNumber,
        employeeName: demoAuth.getCurrentUser()?.name,
        paymentMethod,
        payments: payments.length ? payments : undefined,
        amountReceived: payment.amountReceived,
        change: payment.change,
        subtotalBeforeDiscount: discountTotal > 0 ? subtotalBeforeDiscount : undefined,
        discountTotal: discountTotal > 0 ? discountTotal : undefined,
        date: saleDate,
      });
    } catch (e) {
      console.error(e);
      alert("Error al registrar la venta");
    } finally {
      setProcessing(false);
      refreshData();
    }
  };

  const handleNewSale = () => {
    setTicketData(null);
  };

  const handleCobrarClick = () => {
    if (!hasOpenShift) {
      return;
    }
    setShowPaymentModal(true);
  };

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden">
      <div className="flex-shrink-0 px-4 pt-2 pb-1">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-primary-600" />
          Caja
        </h2>
        <p className="text-xs text-slate-500">Registra ventas en tiempo real</p>
      </div>

      {!hasOpenShift && (
        <div className="flex-shrink-0 mx-4 mt-2 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-800">Debes abrir un turno para registrar ventas</p>
            <p className="text-xs text-amber-700 mt-0.5">Abre turno en Turnos para poder cobrar y hacer el corte al final del día.</p>
          </div>
          <Link
            href="/turnos"
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 shrink-0"
          >
            <Clock className="w-4 h-4" />
            Abrir turno
          </Link>
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-2 p-2">
        {/* Lista de productos */}
        <div className="flex-1 min-h-0 flex flex-col border border-slate-200 rounded-xl bg-white overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, SKU o escanear código de barras"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                autoFocus
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">
                {items.length === 0 ? "No hay productos. Configura el inventario primero." : "Sin resultados"}
              </p>
            ) : (
              <div className="space-y-1">
                {filtered.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200"
                  >
                    <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center">
                      {getProductImageUrl(item.id) ? (
                        <Image
                          src={getProductImageUrl(item.id)!}
                          alt={item.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => addToCart(item)}
                      disabled={item.stock <= 0}
                      className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:justify-between text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="font-medium text-slate-900 truncate text-sm">{item.name}</span>
                      <span className="text-xs text-slate-500 shrink-0 mt-0.5 sm:mt-0 sm:ml-2">
                        Stock: {item.stock} {item.price != null ? `· $${item.price}` : ""}
                      </span>
                    </button>
                    <div className="flex gap-0.5 shrink-0">
                      {[1, 2, 5, 10].map((qty) => (
                        <button
                          key={qty}
                          type="button"
                          onClick={() => addToCart(item, qty)}
                          disabled={item.stock < qty}
                          className="min-w-[28px] h-7 px-1.5 rounded-md bg-primary-100 text-primary-700 text-xs font-semibold hover:bg-primary-200 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          +{qty}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Carrito */}
        <div className="w-full md:w-80 flex-shrink-0 flex flex-col border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
          <div className="p-2 border-b border-slate-200 font-medium text-slate-900">
            Carrito ({cart.length})
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-2">
            {cart.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">Carrito vacío</p>
            ) : (
              <ul className="space-y-2">
                {cart.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-100"
                  >
                    <div className="shrink-0 w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center">
                      {getProductImageUrl(c.id) ? (
                        <Image
                          src={getProductImageUrl(c.id)!}
                          alt={c.name}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 text-sm truncate">{c.name}</p>
                      <p className="text-xs text-slate-500">
                        {c.quantity} × {c.price != null ? `$${c.price}` : "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateCartQty(c.id, -1)}
                        className="p-1 rounded bg-slate-200 hover:bg-slate-300"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-medium">{c.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateCartQty(c.id, 1)}
                        className="p-1 rounded bg-slate-200 hover:bg-slate-300"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFromCart(c.id)}
                        className="p-1 rounded text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="p-3 border-t border-slate-200 bg-white">
            {cart.length > 0 && (
              <div className="mb-3 space-y-2">
                <p className="text-xs font-medium text-slate-600 flex items-center gap-1"
                  >Descuento {!discountUnlocked && <Lock className="w-3 h-3 text-slate-400" />}</p>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    if (discountUnlocked) return;
                    e.preventDefault();
                    handleDiscountSectionClick();
                  }}
                  onKeyDown={(e) => {
                    if (!discountUnlocked && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      handleDiscountSectionClick();
                    }
                  }}
                  className={`flex gap-2 rounded-lg ${!discountUnlocked ? "cursor-pointer bg-slate-50 border border-dashed border-slate-200 p-2" : ""}`}
                >
                  <div className="flex-1 relative">
                    <Percent className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder={discountUnlocked ? "0" : "—"}
                      value={discountPercent}
                      onChange={(e) => {
                        if (!discountUnlocked) return;
                        setDiscountPercent(e.target.value);
                        if (e.target.value.trim()) setDiscountAmount("");
                      }}
                      onFocus={(e) => {
                        if (!discountUnlocked) {
                          e.target.blur();
                          handleDiscountSectionClick();
                        }
                      }}
                      readOnly={!discountUnlocked}
                      className={`w-full pl-8 pr-2 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 ${!discountUnlocked ? "bg-slate-50 cursor-pointer" : ""}`}
                    />
                  </div>
                  <div className="flex-1 relative">
                    <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder={discountUnlocked ? "0" : "—"}
                      value={discountAmount}
                      onChange={(e) => {
                        if (!discountUnlocked) return;
                        setDiscountAmount(e.target.value);
                        if (e.target.value.trim()) setDiscountPercent("");
                      }}
                      onFocus={(e) => {
                        if (!discountUnlocked) {
                          e.target.blur();
                          handleDiscountSectionClick();
                        }
                      }}
                      readOnly={!discountUnlocked}
                      className={`w-full pl-8 pr-2 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 ${!discountUnlocked ? "bg-slate-50 cursor-pointer" : ""}`}
                    />
                  </div>
                  {(discountPercent || discountAmount) && discountUnlocked && (
                    <button
                      type="button"
                      onClick={clearDiscount}
                      className="px-2 py-2 text-slate-500 hover:text-slate-700"
                      aria-label="Quitar descuento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {!discountUnlocked && (
                  <p className="text-xs text-slate-500">Toca para ingresar contraseña y aplicar descuento</p>
                )}
              </div>
            )}
            <div className="space-y-1 mb-3">
              {discountTotal > 0 && (
                <>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Subtotal</span>
                    <span>${subtotalBeforeDiscount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>Descuento</span>
                    <span>-${discountTotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Total</span>
                <span className="text-xl font-bold text-slate-900">
                  {total > 0 ? `$${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}` : "—"}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCobrarClick}
              disabled={cart.length === 0 || processing || !hasOpenShift}
              className="w-full py-4 bg-emerald-600 text-white font-bold text-lg rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30"
            >
              {processing ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShoppingCart className="w-6 h-6" />}
              {!hasOpenShift ? "Abre un turno para cobrar" : "Cobrar"}
            </button>
          </div>
        </div>
      </div>

      {showPaymentModal && (
        <PaymentModal
          total={total}
          onConfirm={processSaleWithPayment}
          onClose={() => setShowPaymentModal(false)}
        />
      )}

      {ticketData && (
        <TicketPreview
          data={ticketData}
          onNewSale={handleNewSale}
        />
      )}

      <AnimatePresence>
        {showDiscountPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => {
              setShowDiscountPasswordModal(false);
              setDiscountPassword("");
              setDiscountPasswordError("");
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <Lock className="w-5 h-5 text-slate-500" />
                Contraseña del gerente
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                Solo Zavala (gerente) puede autorizar descuentos (% o $)
              </p>
              <form onSubmit={handleDiscountPasswordSubmit} className="space-y-4">
                <input
                  type="password"
                  value={discountPassword}
                  onChange={(e) => {
                    setDiscountPassword(e.target.value);
                    setDiscountPasswordError("");
                  }}
                  placeholder="Contraseña"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  autoFocus
                />
                {discountPasswordError && (
                  <p className="text-sm text-red-600">{discountPasswordError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDiscountPasswordModal(false);
                      setDiscountPassword("");
                      setDiscountPasswordError("");
                    }}
                    className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700"
                  >
                    Continuar
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
