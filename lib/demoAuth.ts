// Sistema de autenticación demo para pruebas sin Firebase
// Con soporte para perfil de Firestore cuando Firebase está activo

import { employeeAuth } from "./employeeAuth";

const REGISTERED_KEY = "servipartz-demo-registered";
const FIREBASE_USER_KEY = "servipartz-firebase-user";

export interface DemoUser {
  email: string;
  password?: string;
  name: string;
  storeName?: string;
  role?: "admin" | "store_user";
  storeIds?: string[];
}

/** Perfil de Firestore compatible con DemoUser */
export interface FirebaseUserProfile {
  email: string;
  name?: string;
  role: "admin" | "store_user";
  storeIds?: string[];
}

function getRegisteredUsers(): DemoUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(REGISTERED_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveRegisteredUsers(users: DemoUser[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(REGISTERED_KEY, JSON.stringify(users));
}

let currentDemoUser: DemoUser | null = null;

export const demoAuth = {
  signIn: (email: string, password: string): Promise<DemoUser> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = getRegisteredUsers();
        const user = users.find((u) => u.email === email && u.password === password);
        if (user) {
          const emailLower = (user.email || "").toLowerCase();
          if (emailLower === "gabriel@servipartz.com") {
            user.role = "store_user";
            const idx = users.findIndex((u) => (u.email || "").toLowerCase() === emailLower);
            if (idx >= 0) {
              users[idx].role = "store_user";
              saveRegisteredUsers(users);
            }
          }
          currentDemoUser = user;
          localStorage.setItem("demo_user", JSON.stringify(user));
          resolve(user);
        } else {
          reject(new Error("Credenciales incorrectas"));
        }
      }, 500);
    });
  },

  signUp: (email: string, password: string, name?: string, storeName?: string): Promise<DemoUser> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = getRegisteredUsers();
        if (users.find((u) => u.email === email)) {
          reject(new Error("El usuario ya existe"));
          return;
        }
        const newUser: DemoUser = {
          email,
          password,
          name: name || email.split("@")[0],
          storeName: storeName || "Matriz",
          role: "admin",
          storeIds: ["default"],
        };
        users.push(newUser);
        saveRegisteredUsers(users);
        currentDemoUser = newUser;
        localStorage.setItem("demo_user", JSON.stringify(newUser));
        resolve(newUser);
      }, 500);
    });
  },

  signOut: (): void => {
    currentDemoUser = null;
    localStorage.removeItem("demo_user");
    localStorage.removeItem(FIREBASE_USER_KEY);
  },

  /** Inyecta perfil de Firestore (modo Firebase). Usado por AuthGuard tras login. */
  setFirebaseProfile: (profile: FirebaseUserProfile): void => {
    const user: DemoUser = {
      email: profile.email,
      name: profile.name ?? profile.email.split("@")[0],
      storeName: "Matriz",
      role: profile.role,
      storeIds: profile.storeIds ?? ["default"],
    };
    currentDemoUser = user;
  },

  /** Limpia perfil de Firebase (al cerrar sesión). */
  clearFirebaseProfile: (): void => {
    if (typeof window === "undefined") return;
    currentDemoUser = null;
    localStorage.removeItem(FIREBASE_USER_KEY);
  },

  getCurrentUser: (): DemoUser | null => {
    if (currentDemoUser) return currentDemoUser;
    const stored = typeof window !== "undefined" ? localStorage.getItem("demo_user") : null;
    if (stored) {
      const parsed = JSON.parse(stored) as DemoUser & { barName?: string };
      // Migración: barName -> storeName
      if (parsed.barName && !parsed.storeName) {
        parsed.storeName = parsed.barName;
      }
      // Gabriel siempre es vendedor, nunca admin
      if ((parsed.email || "").toLowerCase() === "gabriel@servipartz.com") {
        parsed.role = "store_user";
      }
      currentDemoUser = parsed;
      return currentDemoUser;
    }
    return null;
  },

  isAuthenticated: (): boolean => {
    return demoAuth.getCurrentUser() !== null;
  },

  /** Usuario limitado (Gabriel): vendedor - solo caja, turnos y devoluciones (devoluciones pide contraseña del gerente) */
  isLimitedUser: (): boolean => {
    const user = demoAuth.getCurrentUser();
    if (!user) return false;
    const email = (user.email || "").toLowerCase();
    // Con Firestore: role store_user + email gabriel = limitado
    if (user.role === "store_user" && email === "gabriel@servipartz.com") return true;
    // Modo demo: solo por email
    return email === "gabriel@servipartz.com";
  },

  /** Usuario admin (Zavala): acceso completo - es el gerente */
  isAdminUser: (): boolean => {
    const user = demoAuth.getCurrentUser();
    if (!user) return false;
    // Con Firestore: role admin
    if (user.role === "admin") return true;
    // Modo demo: por email
    const email = (user.email || "").toLowerCase();
    return email === "zavala@servipartz.com" || email === "piti@servipartz.com";
  },

  /** Verifica contraseña del gerente (Zavala) para permitir acciones restringidas a vendedores */
  verifyManagerPassword: (password: string): boolean => {
    // Modo Firebase: usa employeeAuth (gerente en Configuración)
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem(FIREBASE_USER_KEY);
      if (raw) {
        const emp = employeeAuth.validate(password);
        if (emp) {
          const full = employeeAuth.getEmployees().find((e) => e.id === emp.id);
          return full?.role === "gerente";
        }
        return false;
      }
    }
    const users = getRegisteredUsers();
    const manager = users.find(
      (u) =>
        (u.email || "").toLowerCase() === "zavala@servipartz.com" ||
        (u.email || "").toLowerCase() === "piti@servipartz.com"
    );
    return manager ? manager.password === password : false;
  },

  updateStoreName: (storeName: string): void => {
    const user = demoAuth.getCurrentUser();
    if (user && typeof window !== "undefined") {
      user.storeName = storeName.trim() || "Matriz";
      currentDemoUser = user;
      const key = localStorage.getItem(FIREBASE_USER_KEY) ? FIREBASE_USER_KEY : "demo_user";
      localStorage.setItem(key, JSON.stringify(user));
    }
  },

  /** Lista usuarios registrados (solo admin). No expone contraseñas. */
  getRegisteredUsersForAdmin: (): Omit<DemoUser, "password">[] => {
    const users = getRegisteredUsers();
    return users.map(({ password: _, ...u }) => u);
  },

  /** Actualiza las tiendas asignadas a un vendedor/usuario. */
  updateUserStoreIds: (email: string, storeIds: string[]): void => {
    const users = getRegisteredUsers();
    const idx = users.findIndex((u) => (u.email || "").toLowerCase() === email.toLowerCase());
    if (idx === -1) return;
    users[idx].storeIds = storeIds.length > 0 ? storeIds : ["default"];
    saveRegisteredUsers(users);
    const current = demoAuth.getCurrentUser();
    if (current && (current.email || "").toLowerCase() === email.toLowerCase()) {
      current.storeIds = users[idx].storeIds;
      currentDemoUser = current;
      localStorage.setItem("demo_user", JSON.stringify(current));
    }
  },
};
