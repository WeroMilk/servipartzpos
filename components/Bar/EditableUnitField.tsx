"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil } from "lucide-react";
import { employeeAuth } from "@/lib/employeeAuth";

interface EditableUnitFieldProps {
  label: string;
  value: string | number;
  unit?: string;
  isPercentage?: boolean;
  onEdit: (newValue: number, employeeLabel: string) => void;
  className?: string;
  valueClassName?: string;
}

export default function EditableUnitField({
  label,
  value,
  unit = "",
  isPercentage = false,
  onEdit,
  className = "",
  valueClassName = "",
}: EditableUnitFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [password, setPassword] = useState("");
  const [inputValue, setInputValue] = useState(String(value));
  const [error, setError] = useState("");

  const handleOpen = () => {
    setShowPassword(true);
    setPassword("");
    setError("");
  };

  const [currentEmployeeLabel, setCurrentEmployeeLabel] = useState("");

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const employee = employeeAuth.validate(password);
    if (employee) {
      setCurrentEmployeeLabel(employee.label);
      setShowPassword(false);
      setShowEdit(true);
      setInputValue("");
      setError("");
    } else {
      setError("Contraseña incorrecta");
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(inputValue.replace(",", "."));
    if (isNaN(num) || num < 0) {
      setError("Ingresa un número válido");
      return;
    }
    if (isPercentage && num > 100) {
      setError("El porcentaje no puede ser mayor a 100");
      return;
    }
    onEdit(num, currentEmployeeLabel);
    setShowEdit(false);
    setError("");
  };

  return (
    <>
      <div
        className={`group flex flex-col cursor-pointer rounded-md sm:rounded-lg p-1 sm:p-2 border border-apple-border bg-apple-surface hover:border-apple-accent/50 transition-colors ${className}`}
        onClick={handleOpen}
        onKeyDown={(e) => e.key === "Enter" && handleOpen()}
        role="button"
        tabIndex={0}
        title="Editar (contraseña de empleado)"
      >
        <p className="text-[9px] sm:text-[10px] text-apple-text2 mb-0 flex items-center gap-1">
          {label}
          <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-70" />
        </p>
        <p className={`text-[10px] sm:text-sm font-semibold text-apple-text ${valueClassName}`}>
          {value}
          {unit && ` ${unit}`}
        </p>
      </div>

      <AnimatePresence>
        {showPassword && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => { setShowPassword(false); setError(""); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="modal-box bg-apple-surface rounded-2xl p-4 sm:p-6 w-full shadow-2xl flex-shrink-0"
            >
              <h3 className="text-lg font-semibold text-apple-text mb-2">Contraseña de empleado</h3>
              <p className="text-sm text-apple-text2 mb-4">Ingresa tu contraseña para registrar tu ID en el movimiento.</p>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <input
                  id={`editable-unit-password-${label.replace(/\s+/g, "-")}`}
                  name="employeePassword"
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="Contraseña"
                  className="w-full px-4 py-3 bg-apple-surface2 border border-apple-border rounded-xl text-apple-text"
                  autoFocus
                />
                {error && <p className="text-sm text-red-500">{error}</p>}
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setShowPassword(false); setError(""); }} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300">
                    Cancelar
                  </button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-apple-accent text-white rounded-xl hover:opacity-90">
                    Continuar
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEdit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => { setShowEdit(false); setError(""); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="modal-box bg-apple-surface rounded-2xl p-4 sm:p-6 w-full shadow-2xl flex-shrink-0"
            >
              <h3 className="text-lg font-semibold text-apple-text mb-2">Editar {label}</h3>
              <p className="text-sm text-apple-text2 mb-4">Valor actual: {value}{unit ? ` ${unit}` : ""}</p>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <input
                  id={`editable-unit-value-${label.replace(/\s+/g, "-")}`}
                  name="editValue"
                  type="number"
                  step={isPercentage ? 1 : 0.1}
                  min={0}
                  max={isPercentage ? 100 : undefined}
                  value={inputValue}
                  onChange={(e) => { setInputValue(e.target.value); setError(""); }}
                  placeholder={isPercentage ? "0-100" : "Nuevo valor"}
                  className="w-full px-4 py-3 bg-apple-surface2 border border-apple-border rounded-xl text-apple-text"
                  autoFocus
                />
                {error && <p className="text-sm text-red-500">{error}</p>}
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setShowEdit(false); setError(""); }} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300">
                    Cancelar
                  </button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-apple-accent text-white rounded-xl hover:opacity-90">
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
