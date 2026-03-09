"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { employeeAuth } from "@/lib/employeeAuth";
import { isMeasuredInUnits, getUnitShortLabel } from "@/lib/measurementRules";
import { getPortionForCategory } from "@/lib/portionStorage";

interface PortionSelectorProps {
  category: string;
  currentPortion: number;
  onPortionChange: (portion: number, employeeLabel?: string) => void;
}

const PORTION_OPTIONS_OZ = [
  { label: "1/2 oz", value: 0.5 },
  { label: "3/4 oz", value: 0.75 },
  { label: "1 oz", value: 1 },
  { label: "1 1/2 oz", value: 1.5 },
  { label: "2 oz", value: 2 },
  { label: "2 1/2 oz", value: 2.5 },
  { label: "3 oz", value: 3 },
  { label: "12 oz", value: 12 },
];

const PORTION_OPTIONS_UNITS = [
  { label: "1 unid", value: 1 },
  { label: "2 unid", value: 2 },
  { label: "3 unid", value: 3 },
  { label: "6 unid", value: 6 },
  { label: "12 unid", value: 12 },
  { label: "24 unid", value: 24 },
];

export default function PortionSelector({
  category,
  currentPortion,
  onPortionChange,
}: PortionSelectorProps) {
  const useUnits = isMeasuredInUnits(category);
  const portionOptions = useUnits ? PORTION_OPTIONS_UNITS : PORTION_OPTIONS_OZ;
  const unitShort = getUnitShortLabel(category);

  const [selectedPortion, setSelectedPortion] = useState(currentPortion);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingPortion, setPendingPortion] = useState<number | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const portion = getPortionForCategory(category);
    setSelectedPortion(portion);
    onPortionChange(portion);
  }, [category, onPortionChange]);

  const handlePortionClick = (portion: number) => {
    if (portion === selectedPortion) return;
    setPendingPortion(portion);
    setShowPasswordModal(true);
    setPassword("");
    setError("");
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const employee = employeeAuth.validate(password);
    if (employee && pendingPortion !== null) {
      setSelectedPortion(pendingPortion);
      onPortionChange(pendingPortion, employee.label);
      localStorage.setItem(`portion-${category}`, pendingPortion.toString());
      setShowPasswordModal(false);
      setPendingPortion(null);
      setError("");
    } else {
      setError("Contraseña incorrecta");
    }
  };

  return (
    <>
      <div className="flex flex-col items-center gap-0.5 sm:gap-1">
        <p className="text-[8px] min-[400px]:text-[9px] sm:text-[10px] text-apple-text2 font-medium">Unid. venta</p>
        <div className="bg-apple-surface rounded-lg sm:rounded-xl p-1 sm:p-2 border border-apple-border shadow flex-shrink-0">
          <div className="flex flex-col gap-0.5 sm:gap-1 max-h-[100px] min-[400px]:max-h-[120px] sm:max-h-[140px] md:max-h-[180px] overflow-y-auto scrollbar-hide">
            {portionOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handlePortionClick(option.value)}
                className={`px-2 py-0.5 min-[400px]:px-2.5 min-[400px]:py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg text-[9px] min-[400px]:text-[10px] sm:text-xs font-medium transition-all whitespace-nowrap ${
                  selectedPortion === option.value
                    ? "bg-apple-accent text-white shadow"
                    : "bg-apple-surface2 text-apple-text hover:bg-apple-bg"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-[8px] min-[400px]:text-[9px] sm:text-[10px] text-apple-text2 text-center max-w-[56px] sm:max-w-[70px] leading-tight">
          {selectedPortion} {unitShort}/venta
        </p>
      </div>

      {/* Modal de contraseña empleado (responsive: móvil e iPhone) */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => {
              setShowPasswordModal(false);
              setPendingPortion(null);
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
                Contraseña de empleado
              </h3>
              <p className="text-sm text-apple-text2 mb-4">
                Se requiere autorización para cambiar la porción
              </p>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <input
                  id="portion-password"
                  name="portion-password"
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
                {error && <p className="text-sm text-red-500">{error}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPendingPortion(null);
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
    </>
  );
}
