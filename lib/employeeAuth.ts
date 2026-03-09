/**
 * Contraseña por empleado para registrar quién hace cada movimiento.
 * Las contraseñas se pueden editar en Configuración y se guardan en localStorage.
 */

const STORAGE_KEY = "mibarra-employee-passwords";

export interface Employee {
  id: string;
  label: string;
  password: string;
}

/** Valores por defecto (id, label y contraseña inicial). */
export const EMPLOYEES: Employee[] = [
  { id: "Gerente", label: "Gerente", password: "gerente123" },
  { id: "001", label: "ID 001", password: "empleado001" },
  { id: "002", label: "ID 002", password: "empleado002" },
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
    }));
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
