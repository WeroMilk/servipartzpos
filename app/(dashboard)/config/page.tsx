"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { employeeAuth } from "@/lib/employeeAuth";
import type { Employee } from "@/lib/employeeAuth";
import { movementsService, notificationsService } from "@/lib/movements";
import { demoAuth } from "@/lib/demoAuth";
import { loadBarBottles } from "@/lib/barStorage";
import { buildOrderReport } from "@/lib/orderReport";
import { Lock, Package, ShoppingCart, Download, MessageCircle, Check, Loader2, Store } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const WHATSAPP_RECIPIENTS = [
  { label: "6623501632 - Encargado de Compras", value: "6623501632 - Encargado de Compras" },
];

function extractPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.startsWith("52") ? digits : "52" + digits;
}

export default function ConfigPage() {
  const [employees, setEmployees] = useState<Employee[]>(() => employeeAuth.getEmployees());
  const [showPassword, setShowPassword] = useState(false);
  const [editingPassword, setEditingPassword] = useState<Record<string, string>>({});
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [savingEmployeeId, setSavingEmployeeId] = useState<string | null>(null);
  const [savedEmployeeId, setSavedEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    setEmployees(employeeAuth.getEmployees());
  }, []);
  const [orderReportText, setOrderReportText] = useState("");
  const [orderRecipient, setOrderRecipient] = useState(WHATSAPP_RECIPIENTS[0]?.value ?? "");

  const handleGenerateOrder = () => {
    const bottles = loadBarBottles();
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

  const handleSendWhatsApp = () => {
    const phone = extractPhone(orderRecipient);
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(orderReportText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setShowOrderModal(false);
  };

  const handlePasswordChange = (emp: Employee, newPassword: string): boolean => {
    const trimmed = newPassword.trim();
    if (!trimmed) {
      alert("La contraseña no puede estar vacía.");
      return false;
    }
    const previousPassword = emp.password;
    if (trimmed === previousPassword) {
      setEditingPassword((prev) => {
        const next = { ...prev };
        delete next[emp.id];
        return next;
      });
      return false;
    }
    employeeAuth.setEmployeePassword(emp.id, trimmed);
    setEmployees(employeeAuth.getEmployees());
    setEditingPassword((prev) => {
      const next = { ...prev };
      delete next[emp.id];
      return next;
    });
    movementsService.add({
      type: "employee_password_change",
      bottleId: "_",
      bottleName: "Configuración",
      newValue: 0,
      userName: demoAuth.getCurrentUser()?.name ?? "Usuario",
      description: `Contraseña de «${emp.label}» actualizada`,
    });
    notificationsService.incrementUnread();
    return true;
  };

  const onSavePassword = (emp: Employee) => {
    const newPassword = editingPassword[emp.id] ?? emp.password;
    setSavingEmployeeId(emp.id);
    setTimeout(() => {
      const didSave = handlePasswordChange(emp, newPassword);
      setSavingEmployeeId(null);
      if (didSave) {
        setSavedEmployeeId(emp.id);
        setTimeout(() => setSavedEmployeeId(null), 1800);
      }
    }, 280);
  };

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden bg-apple-bg">
      <div className="flex-shrink-0 px-4 pt-2 pb-1">
        <h2 className="text-lg font-semibold text-apple-text">Configuraciones</h2>
        <p className="text-xs text-apple-text2">Ajustes de tienda, contraseñas y pedidos.</p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col px-2 sm:px-4 py-2 sm:py-3 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] sm:pb-3" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="flex-1 min-h-0 min-w-0 flex flex-col gap-2 sm:gap-3 max-w-5xl mx-auto w-full">
          <Link
            href="/select-store"
            className="flex items-center gap-3 p-3 rounded-xl border border-apple-border bg-apple-surface hover:bg-apple-bg transition-colors"
          >
            <Store className="w-5 h-5 text-apple-accent" />
            <div className="flex-1 text-left">
              <p className="font-medium text-apple-text text-sm">Cambiar tienda</p>
              <p className="text-xs text-apple-text2">Selecciona otra sucursal para trabajar</p>
            </div>
          </Link>
          {/* Contraseña de empleado - ocupa la fila superior completa en desktop */}
          <section className="flex flex-col min-h-0 min-w-0 bg-apple-surface rounded-xl sm:rounded-2xl border border-apple-border shadow-sm overflow-hidden">
            <div className="flex-shrink-0 px-3 sm:px-4 py-2 sm:py-3 border-b border-apple-border/60 flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-apple-accent/10">
                <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-apple-accent" aria-hidden />
              </div>
              <div className="min-w-0">
                <h2 className="text-xs sm:text-sm font-semibold text-apple-text truncate">Contraseña de empleado</h2>
                <p className="text-[10px] sm:text-xs text-apple-text2 truncate">Edita contraseñas; se registra en Movimientos.</p>
              </div>
            </div>
            {/* En mobile, permitir scroll si hiciera falta; en desktop, sin scroll interno */}
            <div className="flex-1 min-h-0 overflow-y-auto md:overflow-visible overflow-x-hidden p-2 sm:p-3 space-y-2">
              {employees.map((emp) => (
                <div key={emp.id} className="rounded-lg sm:rounded-xl border border-apple-border bg-apple-bg/50 p-2 sm:p-3 space-y-1.5">
                  <label htmlFor={`employee-password-${emp.id}`} className="block text-[11px] sm:text-xs font-medium text-apple-text">{emp.label}</label>
                  <div className="flex flex-col sm:flex-row gap-1.5">
                    <input
                      id={`employee-password-${emp.id}`}
                      name={`employee-password-${emp.id}`}
                      type={showPassword ? "text" : "password"}
                      value={editingPassword[emp.id] ?? emp.password}
                      onChange={(e) =>
                        setEditingPassword((prev) => ({ ...prev, [emp.id]: e.target.value }))
                      }
                      placeholder="Contraseña"
                      className="flex-1 min-w-0 px-2.5 py-2 text-xs sm:text-sm font-mono bg-apple-surface border border-apple-border rounded-lg focus:outline-none focus:ring-2 focus:ring-apple-accent"
                    />
                    <button
                      type="button"
                      onClick={() => onSavePassword(emp)}
                      disabled={savingEmployeeId !== null}
                      className="shrink-0 px-3 py-2 bg-apple-accent text-white text-xs sm:text-sm font-medium rounded-lg hover:opacity-90 inline-flex items-center justify-center gap-1.5 disabled:opacity-70 min-h-[40px] sm:min-h-0"
                    >
                      {savingEmployeeId === emp.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
                      ) : savedEmployeeId === emp.id ? (
                        <><Check className="w-3.5 h-3.5" aria-hidden /> Guardado</>
                      ) : (
                        "Guardar"
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex-shrink-0 p-2 sm:p-3 pt-0">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="w-full px-3 py-2 text-xs sm:text-sm font-medium rounded-lg border border-apple-border text-apple-text bg-apple-surface hover:bg-apple-bg"
              >
                {showPassword ? "Ocultar contraseñas" : "Ver contraseñas"}
              </button>
            </div>
          </section>

          {/* En desktop, estos dos bloques quedan abajo en dos columnas (mitad y mitad) */}
          <div className="flex flex-col md:flex-row gap-2 sm:gap-3 w-full">
            {/* Generar pedido */}
            <section className="flex flex-col min-h-0 min-w-0 bg-apple-surface rounded-xl sm:rounded-2xl border border-apple-border shadow-sm overflow-hidden md:flex-1">
              <div className="flex-shrink-0 px-3 sm:px-4 py-2 sm:py-3 border-b border-apple-border/60 flex items-center gap-2 w-full">
                <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-apple-accent/10 shrink-0">
                  <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-apple-accent" aria-hidden />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xs sm:text-sm font-semibold text-apple-text truncate">Generar pedido</h2>
                  <p className="text-[10px] sm:text-xs text-apple-text2 truncate">Faltantes y bajo 25%. WhatsApp.</p>
                </div>
              </div>
              <div className="flex-1 md:flex-initial w-full flex items-center justify-center p-3 sm:p-4 min-h-[72px] md:min-h-0 md:py-4">
                <button
                  type="button"
                  onClick={handleGenerateOrder}
                  className="inline-flex items-center justify-center gap-1.5 w-full min-w-0 px-3 py-2.5 sm:py-3 bg-apple-accent text-white text-xs sm:text-sm font-medium rounded-xl hover:opacity-90 whitespace-nowrap"
                >
                  <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
                  Generar pedido
                </button>
              </div>
            </section>

            {/* Mi inventario */}
            <section className="flex flex-col min-h-0 min-w-0 bg-apple-surface rounded-xl sm:rounded-2xl border border-apple-border shadow-sm overflow-hidden md:flex-1">
              <div className="flex-shrink-0 px-3 sm:px-4 py-2 sm:py-3 border-b border-apple-border/60 flex items-center gap-2 w-full">
                <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-apple-accent/10 shrink-0">
                  <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-apple-accent" aria-hidden />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xs sm:text-sm font-semibold text-apple-text truncate">Mi inventario</h2>
                  <p className="text-[10px] sm:text-xs text-apple-text2 truncate">Añade o quita productos.</p>
                </div>
              </div>
              <div className="flex-1 md:flex-initial w-full flex items-center justify-center p-3 sm:p-4 min-h-[72px] md:min-h-0 md:py-4">
                <Link
                  href="/select-bottles"
                  className="inline-flex items-center justify-center gap-1.5 w-full min-w-0 px-3 py-2.5 sm:py-3 bg-apple-accent text-white text-xs sm:text-sm font-medium rounded-xl hover:opacity-90 whitespace-nowrap"
                >
                  <Package className="w-3.5 h-3.5 shrink-0" />
                  Modifica tu inventario
                </Link>
              </div>
            </section>
          </div>
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
