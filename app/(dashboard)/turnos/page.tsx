"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, DollarSign, Loader2, ChevronLeft, ChevronRight, X } from "lucide-react";
import { storeStore } from "@/lib/storeStore";
import { employeeAuth } from "@/lib/employeeAuth";
import { demoAuth } from "@/lib/demoAuth";
import { movementsService, notificationsService } from "@/lib/movements";
import {
  getCurrentShift,
  openShift,
  closeShift,
  getShiftsForStore,
  type Shift,
} from "@/lib/shiftService";

export default function TurnosPage() {
  const storeId = typeof window !== "undefined" ? storeStore.getStoreId() : null;
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);
  const [initialCash, setInitialCash] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAmount, setPendingAmount] = useState<number | null>(null);

  const refreshShift = () => {
    if (storeId) {
      setCurrentShift(getCurrentShift(storeId));
    }
  };

  useEffect(() => {
    refreshShift();
  }, [storeId]);

  const employees = employeeAuth.getEmployeesForCurrentUser();
  const defaultEmpId = demoAuth.isLimitedUser() ? "001" : employees[0]?.id;
  const effectiveEmployeeId = selectedEmployeeId || defaultEmpId || "";

  const handleOpenShiftClick = () => {
    const amount = parseFloat(initialCash.replace(",", ".")) || 0;
    if (amount < 0) {
      setError("El monto inicial debe ser mayor o igual a 0");
      return;
    }
    setPendingAmount(amount);
    setShowConfirmModal(true);
  };

  const handleConfirmOpenShift = () => {
    if (pendingAmount == null) return;
    const emp = employees.find((e) => e.id === effectiveEmployeeId);
    const employeeName = emp?.label ?? "Cajero";
    const employeeId = effectiveEmployeeId || "default";
    setShowConfirmModal(false);
    setPendingAmount(null);
    setLoading(true);
    setError("");
    try {
      openShift(storeId ?? "default", employeeId, employeeName, pendingAmount);
      movementsService.add({
        type: "shift_open",
        bottleId: "_",
        bottleName: "Caja",
        newValue: pendingAmount,
        userName: demoAuth.getCurrentUser()?.name ?? employeeName,
        description: `Apertura de caja: ${employeeName} - Fondo inicial $${pendingAmount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,
      });
      notificationsService.incrementUnread();
      setInitialCash("");
      refreshShift();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al abrir turno");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseShift = () => {
    if (!currentShift) return;
    setLoading(true);
    setError("");
    try {
      closeShift(currentShift.id);
      refreshShift();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cerrar turno");
    } finally {
      setLoading(false);
    }
  };

  if (!storeId) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <p className="text-slate-500 text-sm">Selecciona una tienda primero</p>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden">
      <div className="flex-shrink-0 px-4 pt-2 pb-1">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary-600" />
          Turnos
        </h2>
        <p className="text-xs text-slate-500">Abre y cierra turnos para corte de caja</p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>
        )}

        {currentShift ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                Turno abierto
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Cajero</span>
                  <span className="font-medium">{currentShift.employeeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Abierto desde</span>
                  <span className="font-medium">
                    {currentShift.openedAt.toLocaleString("es-MX", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fondo inicial</span>
                  <span className="font-medium text-emerald-600">
                    ${currentShift.initialCash.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <a
                href={`/turnos/corte?shiftId=${currentShift.id}`}
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700"
              >
                <DollarSign className="w-5 h-5" />
                Cerrar turno (Corte de caja)
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-3">Abrir turno</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Cajero
                  </label>
                  <select
                    value={effectiveEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                  >
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Fondo inicial (efectivo en caja)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={initialCash}
                      onChange={(e) => setInitialCash(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenShiftClick}
              disabled={loading}
              className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Clock className="w-5 h-5" />}
              Abrir turno
            </button>
          </div>
        )}

        <AnimatePresence>
          {showConfirmModal && pendingAmount != null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              onClick={() => {
                setShowConfirmModal(false);
                setPendingAmount(null);
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Confirmar fondo inicial</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowConfirmModal(false);
                      setPendingAmount(null);
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    aria-label="Cerrar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-slate-600 mb-6">
                  ¿Confirmas que el fondo inicial de efectivo es{" "}
                  <span className="font-bold text-slate-900">
                    ${pendingAmount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </span>
                  ?
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowConfirmModal(false);
                      setPendingAmount(null);
                    }}
                    className="flex-1 py-3 px-4 bg-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmOpenShift}
                    className="flex-1 py-3 px-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700"
                  >
                    Aceptar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="font-medium text-slate-700 text-sm mb-2">Historial reciente</h3>
          <ShiftHistory storeId={storeId} />
        </div>
      </div>
    </div>
  );
}

const ITEMS_PER_PAGE = 5;

function ShiftHistory({ storeId }: { storeId: string }) {
  const [page, setPage] = useState(0);
  const [shifts, setShifts] = useState<Shift[]>([]);

  useEffect(() => {
    const all = getShiftsForStore(storeId, 200).filter((s) => s.status === "closed");
    setShifts(all);
    setPage(0);
  }, [storeId]);

  const totalPages = Math.max(1, Math.ceil(shifts.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages - 1);
  const pageShifts = shifts.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: true });
  const formatDate = (d: Date) => d.toLocaleDateString("es-MX");

  if (shifts.length === 0) {
    return <p className="text-xs text-slate-500">Sin turnos cerrados</p>;
  }

  return (
    <div>
      <ul className="space-y-2">
        {pageShifts.map((s) => (
          <li
            key={s.id}
            className="flex flex-col gap-0.5 py-2 border-b border-slate-200 last:border-0"
          >
            <div className="flex justify-between items-start">
              <span className="font-medium text-slate-700">{s.employeeName}</span>
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-200 text-slate-600">
                Cerrado
              </span>
            </div>
            <div className="text-xs text-slate-500">
              {formatDate(s.openedAt)} · Abierto {formatTime(s.openedAt)} · Cerrado{" "}
              {s.closedAt ? formatTime(s.closedAt) : "—"}
            </div>
          </li>
        ))}
      </ul>
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>
          <span className="text-xs text-slate-500">
            {currentPage + 1} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
            className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Siguiente
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
