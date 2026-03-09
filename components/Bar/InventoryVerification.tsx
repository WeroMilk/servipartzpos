"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Loader2 } from "lucide-react";
import { employeeAuth } from "@/lib/employeeAuth";

type PendingAction = "confirm_ok" | "incorrect" | null;

interface InventoryVerificationProps {
  displayValue: number;
  unit: "oz" | "units";
  unitLabel: string;
  onConfirm: (isCorrect: boolean, employeeLabel: string) => void;
  onEdit: (newValue: number, employeeLabel: string) => void;
  onReportIncorrect?: (employeeLabel: string) => void;
  lastVerifiedLabel?: string;
}

export default function InventoryVerification({
  displayValue,
  unit,
  unitLabel,
  onConfirm,
  onEdit,
  onReportIncorrect,
  lastVerifiedLabel,
}: InventoryVerificationProps) {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [currentEmployeeLabel, setCurrentEmployeeLabel] = useState<string>("");
  const [password, setPassword] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [newValue, setNewValue] = useState(displayValue.toString());
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState<"ok" | "fail" | null>(null);

  useEffect(() => {
    setNewValue(unit === "units" ? String(Math.round(displayValue)) : displayValue.toFixed(1));
  }, [displayValue, unit]);

  const handleCorrect = () => {
    setPendingAction("confirm_ok");
    setShowPasswordModal(true);
    setPassword("");
    setError("");
  };

  const handleIncorrect = () => {
    setPendingAction("incorrect");
    setShowPasswordModal(true);
    setPassword("");
    setError("");
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const employee = employeeAuth.validate(password);
    if (employee) {
      setShowPasswordModal(false);
      setPassword("");
      setError("");
      if (pendingAction === "confirm_ok") {
        setIsLoading("ok");
        setTimeout(() => {
          onConfirm(true, employee.label);
          setIsLoading(null);
        }, 400);
      } else if (pendingAction === "incorrect") {
        setCurrentEmployeeLabel(employee.label);
        onReportIncorrect?.(employee.label);
        setShowEditModal(true);
        setNewValue("");
      }
      setPendingAction(null);
    } else {
      setError("Contraseña incorrecta");
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(newValue.replace(",", "."));
    if (isNaN(value) || value < 0) {
      setError(unit === "units" ? "Ingresa un valor válido" : "Ingresa un valor válido");
      return;
    }
    onEdit(value, currentEmployeeLabel);
    setNewValue(value.toString());
    setShowEditModal(false);
    setError("");
  };

  return (
    <>
      <div className="flex flex-col items-center gap-1 sm:gap-2">
        {/* Espacio fijo para la etiqueta de última verificación: los botones no se mueven al mostrar/ocultar fecha */}
        <div className="min-h-[20px] min-[400px]:min-h-[22px] sm:min-h-6 flex flex-col items-center justify-end w-full max-w-[80px] sm:max-w-[100px]">
          {lastVerifiedLabel && (
            <span className="text-[9px] min-[400px]:text-[10px] sm:text-xs text-apple-text2 text-center w-full leading-tight" title={lastVerifiedLabel}>
              {lastVerifiedLabel}
            </span>
          )}
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <button
            onClick={handleCorrect}
            disabled={isLoading !== null}
            className="w-9 h-9 min-[400px]:w-10 min-[400px]:h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-white border-2 border-green-600 text-green-600 hover:bg-green-50 active:scale-95 transition-all flex items-center justify-center shadow disabled:opacity-70 flex-shrink-0"
            title="Inventario correcto"
          >
            {isLoading === "ok" ? (
              <Loader2 className="w-4 h-4 min-[400px]:w-5 min-[400px]:h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 animate-spin" />
            ) : (
              <Check className="w-4 h-4 min-[400px]:w-5 min-[400px]:h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
            )}
          </button>
        </div>
        <button
          onClick={handleIncorrect}
          disabled={isLoading !== null}
          className="w-9 h-9 min-[400px]:w-10 min-[400px]:h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-white border-2 border-red-600 text-red-600 hover:bg-red-50 active:scale-95 transition-all flex items-center justify-center shadow disabled:opacity-70 flex-shrink-0"
          title="Inventario incorrecto"
        >
          {isLoading === "fail" ? (
            <Loader2 className="w-4 h-4 min-[400px]:w-5 min-[400px]:h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 animate-spin" />
          ) : (
            <X className="w-4 h-4 min-[400px]:w-5 min-[400px]:h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
          )}
        </button>
      </div>

      {/* Modal de contraseña (responsive: móvil e iPhone, no se corta) */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => {
              setShowPasswordModal(false);
              setPassword("");
              setError("");
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="modal-box bg-apple-surface rounded-2xl p-4 sm:p-6 w-full shadow-2xl flex-shrink-0"
            >
              <h3 className="text-lg font-semibold text-apple-text mb-2">
                Contraseña de Gerente
              </h3>
              <p className="text-sm text-apple-text2 mb-4">
                Se requiere contraseña de gerente para editar el inventario
              </p>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <input
                  id="inventory-verification-password"
                  name="manager-password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Contraseña"
                  className="w-full px-4 py-3 bg-apple-surface2 border border-apple-border rounded-xl text-apple-text placeholder-apple-text2 focus:outline-none focus:ring-2 focus:ring-apple-accent"
                  autoFocus
                />
                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPassword("");
                      setError("");
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-apple-accent text-white rounded-xl hover:opacity-90 transition-opacity"
                  >
                    Continuar
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de edición (responsive: móvil e iPhone) */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => {
              setShowEditModal(false);
              setNewValue("");
              setError("");
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="modal-box bg-apple-surface rounded-2xl p-4 sm:p-6 w-full shadow-2xl flex-shrink-0"
            >
              <h3 className="text-lg font-semibold text-apple-text mb-2">
                Editar Disponibilidad
              </h3>
              <p className="text-sm text-apple-text2 mb-4">
                Valor actual: {unit === "units" ? displayValue.toFixed(1) : displayValue.toFixed(1)} {unitLabel}
              </p>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <input
                  id="inventory-edit-value"
                  name="newValue"
                  type="number"
                  step="0.1"
                  min={0}
                  inputMode={unit === "units" ? "numeric" : "decimal"}
                  value={newValue}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (unit === "units") {
                      if (v === "" || /^\d+$/.test(v)) setNewValue(v);
                    } else {
                      setNewValue(v);
                    }
                    setError("");
                  }}
                  placeholder={unit === "units" ? "Nuevo valor (unidades, entero)" : "Nuevo valor en oz"}
                  className="w-full px-4 py-3 bg-apple-surface2 border border-apple-border rounded-xl text-apple-text placeholder-apple-text2 focus:outline-none focus:ring-2 focus:ring-apple-accent"
                  autoFocus
                />
                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setNewValue("");
                      setError("");
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-apple-accent text-white rounded-xl hover:opacity-90 transition-opacity"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
