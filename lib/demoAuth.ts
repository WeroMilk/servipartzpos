// Sistema de autenticación demo para pruebas sin Firebase
// Sin credenciales hardcodeadas por seguridad

const REGISTERED_KEY = "servipartz-demo-registered";

export interface DemoUser {
  email: string;
  password: string;
  name: string;
  storeName?: string;
  role?: "admin" | "store_user";
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
  },

  getCurrentUser: (): DemoUser | null => {
    if (currentDemoUser) return currentDemoUser;
    const stored = localStorage.getItem("demo_user");
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

  /** Usuario limitado (Gabriel): vendedor - solo caja, inventario, turnos y devoluciones (devoluciones pide contraseña de Zavala) */
  isLimitedUser: (): boolean => {
    const user = demoAuth.getCurrentUser();
    if (!user) return false;
    const email = (user.email || "").toLowerCase();
    return email === "gabriel@servipartz.com";
  },

  /** Usuario admin (Zavala): acceso completo - es el gerente */
  isAdminUser: (): boolean => {
    const user = demoAuth.getCurrentUser();
    if (!user) return false;
    const email = (user.email || "").toLowerCase();
    return email === "zavala@servipartz.com" || email === "piti@servipartz.com";
  },

  /** Verifica contraseña del gerente (Zavala) para permitir acciones restringidas a vendedores */
  verifyManagerPassword: (password: string): boolean => {
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
    if (user) {
      user.storeName = storeName.trim() || "Matriz";
      currentDemoUser = user;
      localStorage.setItem("demo_user", JSON.stringify(user));
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
