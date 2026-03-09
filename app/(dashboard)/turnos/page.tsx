"use client";

import { useState, useEffect } from "react";
import { Clock, DollarSign, User, Loader2 } from "lucide-react";
import { storeStore } from "@/lib/storeStore";
import { demoAuth } from "@/lib/demoAuth";
import { employeeAuth } from "@/lib/employeeAuth";
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

  const refreshShift = () => {
    if (storeId) {
      setCurrentShift(getCurrentShift(storeId));
    }
  };

  useEffect(() => {
    refreshShift();
  }, [storeId]);

  const employees = employeeAuth.getEmployees();
  const currentUser = demoAuth.getCurrentUser();

  const handleOpenShift = () => {
    const amount = parseFloat(initialCash.replace(",", ".")) || 0;
    if (amount < 0) {
      setError("El monto inicial debe ser mayor o igual a 0");
      return;
    }
    const emp = employees.find((e) => e.id === selectedEmployeeId);
    const employeeName = emp?.label ?? currentUser?.name ?? "Cajero";
    const employeeId = selectedEmployeeId || (currentUser?.email ?? "default");
    setLoading(true);
    setError("");
    try {
      openShift(storeId ?? "default", employeeId, employeeName, amount);
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
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">{currentUser?.name ?? "Usuario actual"}</option>
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
              onClick={handleOpenShift}
              disabled={loading}
              className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Clock className="w-5 h-5" />}
              Abrir turno
            </button>
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="font-medium text-slate-700 text-sm mb-2">Historial reciente</h3>
          <ShiftHistory storeId={storeId} />
        </div>
      </div>
    </div>
  );
}

function ShiftHistory({ storeId }: { storeId: string }) {
  const [shifts, setShifts] = useState<Shift[]>([]);

  useEffect(() => {
    setShifts(getShiftsForStore(storeId, 10));
  }, [storeId]);

  if (shifts.length === 0) {
    return <p className="text-xs text-slate-500">Sin turnos registrados</p>;
  }

  return (
    <ul className="space-y-2">
      {shifts.map((s) => (
        <li
          key={s.id}
          className="flex justify-between items-center text-sm py-2 border-b border-slate-200 last:border-0"
        >
          <span className="text-slate-600">
            {s.employeeName} · {s.openedAt.toLocaleDateString("es-MX")}
          </span>
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium ${
              s.status === "open" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
            }`}
          >
            {s.status === "open" ? "Abierto" : "Cerrado"}
          </span>
        </li>
      ))}
    </ul>
  );
}
