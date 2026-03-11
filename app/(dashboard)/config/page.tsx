"use client";

import { useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { loadInventory } from "@/lib/inventoryStorage";
import { buildOrderReport } from "@/lib/orderReport";
import { exportInventory, exportSales, exportMovements, exportAll } from "@/lib/exportService";
import { Package, ShoppingCart, Download, MessageCircle, Store, Database, FileJson, FileText, ArrowRight, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const WHATSAPP_RECIPIENTS = [
  { label: "6623501632 - Encargado de Compras", value: "6623501632 - Encargado de Compras" },
];

function extractPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.startsWith("52") ? digits : "52" + digits;
}

export default function ConfigPage() {
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderReportText, setOrderReportText] = useState("");
  const [orderRecipient, setOrderRecipient] = useState(WHATSAPP_RECIPIENTS[0]?.value ?? "");
  const [exporting, setExporting] = useState<string | null>(null);

  const handleGenerateOrder = () => {
    const bottles = loadInventory();
    if (bottles.length === 0) {
      alert("No hay productos en tu inventario. Añade productos en Modifica tu inventario primero.");
      return;
    }
    const { text } = buildOrderReport(bottles);
    setOrderReportText(text);
    setOrderRecipient(WHATSAPP_RECIPIENTS[0]?.value ?? "");
    setShowOrderModal(true);
  };

  const handleDownloadOrder = () => {
    const name = `pedido-servipartz-${new Date().toISOString().slice(0, 16).replace("T", "-").replace(":", "")}.txt`;
    const blob = new Blob([orderReportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = async (type: "inventory" | "sales" | "movements" | "all") => {
    setExporting(type);
    try {
      if (type === "inventory") await exportInventory("json");
      else if (type === "sales") await exportSales("json");
      else if (type === "movements") await exportMovements();
      else await exportAll();
    } catch (e) {
      console.error(e);
      alert("Error al exportar");
    } finally {
      setExporting(null);
    }
  };

  const handleSendWhatsApp = () => {
    const phone = extractPhone(orderRecipient);
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(orderReportText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setShowOrderModal(false);
  };

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden bg-apple-bg">
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col items-stretch px-2 sm:px-4 lg:px-6 py-2 sm:py-3 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] sm:pb-3 overflow-touch" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="flex-1 min-h-0 min-w-0 flex flex-col gap-2 sm:gap-3 w-full max-w-6xl mx-auto">
          {/* Cambiar tienda + Datos fiscales: lado a lado en desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3">
            <Link
              href="/stores"
              className="flex items-center gap-3 p-3 sm:p-4 rounded-xl border border-apple-border bg-apple-surface hover:bg-apple-bg transition-colors"
            >
              <Store className="w-5 h-5 sm:w-6 sm:h-6 text-apple-accent shrink-0" />
              <div className="flex-1 min-w-0 text-left">
                <p className="font-medium text-apple-text text-sm sm:text-base">Cambiar tienda</p>
                <p className="text-xs sm:text-sm text-apple-text2 break-words">Selecciona otra sucursal para trabajar</p>
              </div>
            </Link>
            <Link
              href="/cfdi"
              className="flex items-center gap-3 p-3 sm:p-4 rounded-xl border border-apple-border bg-apple-surface hover:bg-apple-bg transition-colors"
            >
              <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-apple-accent/10 shrink-0">
                <FileText className="w-4 h-4 text-apple-accent" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="font-medium text-apple-text text-sm sm:text-base">Datos fiscales (CFDI)</p>
                <p className="text-xs sm:text-sm text-apple-text2 break-words">RFC, régimen y credenciales PAC para facturación electrónica.</p>
              </div>
              <ArrowRight className="w-5 h-5 text-apple-text2 shrink-0" />
            </Link>
          </div>

          {/* Usuarios y tiendas (solo admin) */}
          {auth.isAdminUser() && (
            <Link
              href="/users"
              className="flex items-center gap-3 p-3 sm:p-4 rounded-xl border border-apple-border bg-apple-surface hover:bg-apple-bg transition-colors"
            >
              <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-apple-accent/10 shrink-0">
                <Users className="w-4 h-4 text-apple-accent" aria-hidden />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="font-medium text-apple-text text-sm sm:text-base">Usuarios y tiendas</p>
                <p className="text-xs sm:text-sm text-apple-text2">Contraseñas de empleado y tiendas por vendedor.</p>
              </div>
              <ArrowRight className="w-5 h-5 text-apple-text2 shrink-0" />
            </Link>
          )}

          {/* Generar pedido + Mi inventario */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 w-full">
            {/* Generar pedido */}
            <section className="flex flex-col min-h-0 min-w-0 bg-apple-surface rounded-xl sm:rounded-2xl border border-apple-border shadow-sm overflow-hidden">
              <div className="flex-shrink-0 px-3 sm:px-4 py-2 sm:py-3 border-b border-apple-border/60 flex items-center gap-2 w-full">
                <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-apple-accent/10 shrink-0">
                  <ShoppingCart className="w-4 h-4 text-apple-accent" aria-hidden />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base font-semibold text-apple-text">Generar pedido</h2>
                  <p className="text-xs sm:text-sm text-apple-text2 break-words">Faltantes y bajo 25%. WhatsApp.</p>
                </div>
              </div>
              <div className="flex-1 w-full flex items-center justify-center p-3 sm:p-4">
                <button
                  type="button"
                  onClick={handleGenerateOrder}
                  className="inline-flex items-center justify-center gap-2 w-full min-w-0 px-3 py-3 bg-apple-accent text-white text-sm font-medium rounded-xl hover:opacity-90"
                >
                  <ShoppingCart className="w-4 h-4 shrink-0" />
                  Generar pedido
                </button>
              </div>
            </section>

            {/* Mi inventario */}
            <section className="flex flex-col min-h-0 min-w-0 bg-apple-surface rounded-xl sm:rounded-2xl border border-apple-border shadow-sm overflow-hidden">
              <div className="flex-shrink-0 px-3 sm:px-4 py-2 sm:py-3 border-b border-apple-border/60 flex items-center gap-2 w-full">
                <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-apple-accent/10 shrink-0">
                  <Package className="w-4 h-4 text-apple-accent" aria-hidden />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base font-semibold text-apple-text">Mi inventario</h2>
                  <p className="text-xs sm:text-sm text-apple-text2 break-words">Añade o quita productos.</p>
                </div>
              </div>
              <div className="flex-1 w-full flex items-center justify-center p-3 sm:p-4">
                <Link
                  href="/select-bottles"
                  className="inline-flex items-center justify-center gap-2 w-full min-w-0 px-3 py-3 bg-apple-accent text-white text-sm font-medium rounded-xl hover:opacity-90"
                >
                  <Package className="w-4 h-4 shrink-0" />
                  Modifica tu inventario
                </Link>
              </div>
            </section>
          </div>

          {/* Backup / Exportación - oculto en móvil */}
          <section className="hidden md:block w-full bg-apple-surface rounded-xl sm:rounded-2xl border border-apple-border shadow-sm">
            <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-apple-border/60 flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-apple-accent/10 shrink-0">
                <Database className="w-4 h-4 text-apple-accent" aria-hidden />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-semibold text-apple-text">Backup / Exportación</h2>
                <p className="text-xs sm:text-sm text-apple-text2">Exporta inventario, ventas, movimientos o todo.</p>
              </div>
            </div>
            <div className="p-3 sm:p-4 grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => handleExport("inventory")}
                disabled={exporting !== null}
                className="flex items-center justify-center gap-2 min-w-0 px-3 py-3 bg-apple-bg border border-apple-border rounded-xl text-sm font-medium text-apple-text hover:bg-apple-bg/80 disabled:opacity-50"
              >
                {exporting === "inventory" ? <Loader2 className="w-4 h-4 shrink-0 animate-spin" /> : <FileJson className="w-4 h-4 shrink-0" />}
                Exportar inventario
              </button>
              <button
                type="button"
                onClick={() => handleExport("sales")}
                disabled={exporting !== null}
                className="flex items-center justify-center gap-2 min-w-0 px-3 py-3 bg-apple-bg border border-apple-border rounded-xl text-sm font-medium text-apple-text hover:bg-apple-bg/80 disabled:opacity-50"
              >
                {exporting === "sales" ? <Loader2 className="w-4 h-4 shrink-0 animate-spin" /> : <FileJson className="w-4 h-4 shrink-0" />}
                Exportar ventas
              </button>
              <button
                type="button"
                onClick={() => handleExport("movements")}
                disabled={exporting !== null}
                className="flex items-center justify-center gap-2 min-w-0 px-3 py-3 bg-apple-bg border border-apple-border rounded-xl text-sm font-medium text-apple-text hover:bg-apple-bg/80 disabled:opacity-50"
              >
                {exporting === "movements" ? <Loader2 className="w-4 h-4 shrink-0 animate-spin" /> : <FileJson className="w-4 h-4 shrink-0" />}
                Exportar movimientos
              </button>
              <button
                type="button"
                onClick={() => handleExport("all")}
                disabled={exporting !== null}
                className="flex items-center justify-center gap-2 min-w-0 px-3 py-3 bg-apple-accent text-white rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {exporting === "all" ? <Loader2 className="w-4 h-4 shrink-0 animate-spin" /> : <Download className="w-4 h-4 shrink-0" />}
                Exportar todo
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Modal Generar pedido */}
      <AnimatePresence>
        {showOrderModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6"
            onClick={() => setShowOrderModal(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: "tween", duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-apple-surface rounded-2xl border border-apple-border shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col"
            >
              <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-apple-border/60 flex-shrink-0">
                <h3 className="text-lg font-semibold text-apple-text">Generar pedido</h3>
                <p className="text-sm text-apple-text2 mt-1">Vista previa. Descarga o envía por WhatsApp.</p>
              </div>
              <div className="px-5 py-4 sm:px-6 sm:py-5 flex-1 min-h-0 overflow-hidden flex flex-col gap-4">
                <div>
                  <label htmlFor="order-recipient" className="block text-sm font-medium text-apple-text mb-1.5">
                    ¿A quién enviarlo?
                  </label>
                  <select
                    id="order-recipient"
                    name="orderRecipient"
                    value={orderRecipient}
                    onChange={(e) => setOrderRecipient(e.target.value)}
                    className="w-full px-3 py-2.5 bg-apple-bg border border-apple-border rounded-xl text-sm text-apple-text focus:outline-none focus:ring-2 focus:ring-apple-accent focus:border-transparent"
                  >
                    {WHATSAPP_RECIPIENTS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 min-h-0 flex flex-col">
                  <label htmlFor="order-report-preview" className="block text-sm font-medium text-apple-text mb-1.5">Vista previa</label>
                  <textarea
                    id="order-report-preview"
                    name="orderReportPreview"
                    readOnly
                    value={orderReportText}
                    rows={10}
                    className="w-full px-3 py-2.5 bg-apple-bg border border-apple-border rounded-xl text-sm text-apple-text font-mono resize-none flex-1 min-h-[120px]"
                  />
                </div>
              </div>
              <div className="px-5 py-4 sm:px-6 sm:py-5 border-t border-apple-border/60 flex flex-wrap gap-2 sm:gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-apple-border text-apple-text text-sm font-medium hover:bg-apple-bg transition-colors"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={handleDownloadOrder}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-apple-accent text-white text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  Descargar .txt
                </button>
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] text-white text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <MessageCircle className="w-4 h-4 shrink-0" />
                  Enviar por WhatsApp
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
