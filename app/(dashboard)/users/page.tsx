"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, Lock, Users, Check, Loader2 } from "lucide-react";
import { employeeAuth } from "@/lib/employeeAuth";
import type { Employee } from "@/lib/employeeAuth";
import { auth } from "@/lib/auth";
import { getStores } from "@/lib/firestore";
import type { Store as StoreType } from "@/lib/types";
import { movementsService } from "@/lib/movements";

export default function UsersPage() {
  const [employees, setEmployees] = useState<Employee[]>(() => employeeAuth.getEmployees());
  const [showPassword, setShowPassword] = useState(false);
  const [editingPassword, setEditingPassword] = useState<Record<string, string>>({});
  const [savingEmployeeId, setSavingEmployeeId] = useState<string | null>(null);
  const [savedEmployeeId, setSavedEmployeeId] = useState<string | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<{ email: string; name?: string; role: string; storeIds?: string[] }[]>([]);
  const [allStores, setAllStores] = useState<StoreType[]>([]);
  const [userStoreAssignments, setUserStoreAssignments] = useState<Record<string, string[]>>({});

  useEffect(() => {
    setEmployees(employeeAuth.getEmployees());
  }, []);

  useEffect(() => {
    if (!auth.isAdminUser()) return;
    auth.getRegisteredUsersForAdmin().then((list) => {
      setRegisteredUsers(list);
      const init: Record<string, string[]> = {};
      list.forEach((u) => {
        init[u.email] = u.storeIds ?? [];
      });
      setUserStoreAssignments(init);
    });
    getStores().then(setAllStores);
  }, []);

  const handlePasswordChange = (emp: Employee, newPassword: string): boolean => {
    const trimmed = newPassword.trim();
    if (!trimmed) {
      alert("La contraseña no puede estar vacía.");
      return false;
    }
    if (trimmed === emp.password) {
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
      bottleName: "Usuarios",
      newValue: 0,
      userName: auth.getCurrentUser()?.name ?? "Usuario",
      description: `Contraseña de «${emp.label}» actualizada`,
    });
    return true;
  };

  const handleStoreAssignmentChange = (email: string, storeId: string, checked: boolean) => {
    setUserStoreAssignments((prev) => {
      const current = prev[email] ?? [];
      const next = checked
        ? (current.includes(storeId) ? current : [...current, storeId])
        : current.filter((id) => id !== storeId);
      return { ...prev, [email]: next };
    });
  };

  const handleSaveStoreAssignment = async (email: string) => {
    const storeIds = userStoreAssignments[email] ?? [];
    await auth.updateUserStoreIds(email, storeIds);
    movementsService.add({
      type: "store_name_change",
      bottleId: "_",
      bottleName: "Usuarios",
      newValue: 0,
      userName: auth.getCurrentUser()?.name ?? "Usuario",
      description: `Tiendas asignadas a ${email} actualizadas`,
    });
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

  if (!auth.isAdminUser()) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-slate-600 text-center">Solo el administrador puede ver esta pantalla.</p>
        <Link href="/config" className="text-primary-600 font-medium flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" />
          Volver a Configuración
        </Link>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden bg-apple-bg">
      <div className="flex-shrink-0 px-4 pt-2 pb-1 flex items-center gap-2">
        <Link href="/config" className="p-1.5 rounded-lg hover:bg-slate-200/80 text-slate-600" aria-label="Volver">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-lg font-semibold text-slate-900">Usuarios y tiendas</h2>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-6">
        {/* Contraseñas de empleado */}
        <section className="bg-apple-surface rounded-xl sm:rounded-2xl border border-apple-border shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-apple-border/60 flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-apple-accent/10 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-apple-accent" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-semibold text-apple-text">Contraseñas de empleado</h3>
              <p className="text-xs text-apple-text2">Zavala (gerente) y Gabriel (vendedor). Se usan en caja y devoluciones.</p>
            </div>
          </div>
          <div className="p-4 space-y-3">
            {employees.map((emp) => (
              <div key={emp.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-apple-border bg-apple-bg/50 p-3">
                <label htmlFor={`pw-${emp.id}`} className="w-20 text-sm font-medium text-apple-text shrink-0">{emp.label}</label>
                <input
                  id={`pw-${emp.id}`}
                  type={showPassword ? "text" : "password"}
                  value={editingPassword[emp.id] ?? emp.password}
                  onChange={(e) => setEditingPassword((prev) => ({ ...prev, [emp.id]: e.target.value }))}
                  placeholder="Contraseña"
                  className="flex-1 min-w-[120px] px-3 py-2 text-sm font-mono bg-apple-surface border border-apple-border rounded-lg focus:ring-2 focus:ring-apple-accent"
                />
                <button
                  type="button"
                  onClick={() => onSavePassword(emp)}
                  disabled={savingEmployeeId !== null}
                  className="shrink-0 px-3 py-2 bg-apple-accent text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-70 inline-flex items-center gap-1"
                >
                  {savingEmployeeId === emp.id ? <Loader2 className="w-4 h-4 animate-spin" /> : savedEmployeeId === emp.id ? <Check className="w-4 h-4" /> : "Guardar"}
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="w-full py-2.5 text-sm font-medium rounded-lg border border-apple-border text-apple-text bg-apple-surface hover:bg-apple-bg"
            >
              {showPassword ? "Ocultar contraseñas" : "Ver contraseñas"}
            </button>
          </div>
        </section>

        {/* Tiendas por vendedor */}
        <section className="bg-apple-surface rounded-xl sm:rounded-2xl border border-apple-border shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-apple-border/60 flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-apple-accent/10 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-apple-accent" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-semibold text-apple-text">Tiendas por usuario</h3>
              <p className="text-xs text-apple-text2">Asigna a cada usuario las tiendas donde puede trabajar.</p>
            </div>
          </div>
          <div className="p-4 space-y-4">
            {registeredUsers.length === 0 ? (
              <p className="text-sm text-apple-text2">No hay usuarios registrados.</p>
            ) : (
              registeredUsers.map((user) => (
                <div key={user.email} className="rounded-xl border border-apple-border bg-apple-bg/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div>
                      <p className="font-medium text-apple-text">{user.name ?? user.email}</p>
                      <p className="text-xs text-apple-text2">{user.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSaveStoreAssignment(user.email)}
                      className="shrink-0 px-3 py-2 bg-apple-accent text-white text-xs font-medium rounded-lg hover:opacity-90"
                    >
                      Guardar
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {allStores.map((store) => {
                      const assigned = (userStoreAssignments[user.email] ?? user.storeIds ?? []).includes(store.id);
                      return (
                        <label
                          key={store.id}
                          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors ${
                            assigned ? "border-apple-accent bg-apple-accent/10 text-apple-accent" : "border-apple-border bg-apple-surface text-apple-text2 hover:bg-apple-bg"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={assigned}
                            onChange={(e) => handleStoreAssignmentChange(user.email, store.id, e.target.checked)}
                            className="sr-only"
                          />
                          <span>{store.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
