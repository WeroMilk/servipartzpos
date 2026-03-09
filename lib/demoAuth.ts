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
      currentDemoUser = parsed;
      return currentDemoUser;
    }
    return null;
  },

  isAuthenticated: (): boolean => {
    return demoAuth.getCurrentUser() !== null;
  },

  updateStoreName: (storeName: string): void => {
    const user = demoAuth.getCurrentUser();
    if (user) {
      user.storeName = storeName.trim() || "Matriz";
      currentDemoUser = user;
      localStorage.setItem("demo_user", JSON.stringify(user));
    }
  },
};
