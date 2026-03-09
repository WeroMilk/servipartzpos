/**
 * Contraseña por empleado para registrar quién hace cada movimiento.
 * Las contraseñas se pueden editar en Configuración y se guardan en localStorage.
 */

const STORAGE_KEY = "mibarra-employee-passwords";

export interface Employee {
  id: string;
  label: string;
  password: string;
  /** "gerente" = Zavala; "vendedor" = Gabriel */
  role?: "gerente" | "vendedor";
}

/** Valores por defecto (id, label, contraseña y rol). */
export const EMPLOYEES: Employee[] = [
  { id: "Gerente", label: "Zavala", password: "gerente123", role: "gerente" },
  { id: "001", label: "Gabriel", password: "empleado001", role: "vendedor" },
];

function getStoredPasswords(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, string>)
      : {};
  } catch {
    return {};
  }
}

function setStoredPasswords(passwords: Record<string, string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(passwords));
}

export const employeeAuth = {
  /**
   * Devuelve la lista de empleados con la contraseña actual (guardada o por defecto).
   */
  getEmployees: (): Employee[] => {
    const stored = getStoredPasswords();
    return EMPLOYEES.map((e) => ({
      id: e.id,
      label: e.label,
      password: stored[e.id] ?? e.password,
      role: e.role,
    }));
  },

  /**
   * Empleados visibles según el usuario logueado. Vendedores (Gabriel) solo ven vendedores; gerente (Zavala) ve todos.
   */
  getEmployeesForCurrentUser: (): Employee[] => {
    const all = employeeAuth.getEmployees();
    if (typeof window === "undefined") return all;
    try {
      const raw = localStorage.getItem("demo_user") || localStorage.getItem("servipartz-firebase-user");
      if (!raw) return all;
      const user = JSON.parse(raw) as { email?: string };
      const email = (user?.email || "").toLowerCase();
      if (email === "gabriel@servipartz.com") {
        return all.filter((e) => e.role === "vendedor");
      }
    } catch {
      /* ignore */
    }
    return all;
  },

  /**
   * Actualiza la contraseña de un empleado. Persiste en localStorage.
   */
  setEmployeePassword: (employeeId: string, newPassword: string) => {
    const trimmed = newPassword.trim();
    const stored = getStoredPasswords();
    if (trimmed) {
      stored[employeeId] = trimmed;
    } else {
      delete stored[employeeId];
    }
    setStoredPasswords(stored);
  },

  /**
   * Valida la contraseña y devuelve el empleado (id + label) o null.
   * Usa las contraseñas actuales (editadas o por defecto).
   */
  validate: (password: string): { id: string; label: string } | null => {
    const trimmed = password.trim();
    const employees = employeeAuth.getEmployees();
    const employee = employees.find((e) => e.password === trimmed);
    if (employee) return { id: employee.id, label: employee.label };
    return null;
  },

  getAll: (): Employee[] => employeeAuth.getEmployees(),
};
