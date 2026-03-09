// Sistema de autenticación demo para pruebas sin Firebase
// Usuario de prueba predefinido

export interface DemoUser {
  email: string;
  password: string;
  name: string;
  barName?: string;
  role?: "admin" | "store_user";
  storeIds?: string[];
}

export const DEMO_USERS: DemoUser[] = [
  {
    email: "zavala@servipartz.com",
    password: "sombra123",
    name: "Zavala",
    barName: "Servipartz Hermosillo",
    role: "admin",
    storeIds: ["default"],
  },
];

let currentDemoUser: DemoUser | null = null;

export const demoAuth = {
  signIn: (email: string, password: string): Promise<DemoUser> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = DEMO_USERS.find(
          (u) => u.email === email && u.password === password
        );
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

  signUp: (email: string, password: string, name?: string, barName?: string): Promise<DemoUser> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (DEMO_USERS.find((u) => u.email === email)) {
          reject(new Error("El usuario ya existe"));
          return;
        }
        const newUser: DemoUser = {
          email,
          password,
          name: name || email.split("@")[0],
          barName: barName || "Mi Tienda",
        };
        DEMO_USERS.push(newUser);
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
      currentDemoUser = JSON.parse(stored);
      return currentDemoUser;
    }
    return null;
  },

  isAuthenticated: (): boolean => {
    return demoAuth.getCurrentUser() !== null;
  },

  updateBarName: (barName: string): void => {
    const user = demoAuth.getCurrentUser();
    if (user) {
      user.barName = barName.trim() || "Mi Tienda";
      currentDemoUser = user;
      localStorage.setItem("demo_user", JSON.stringify(user));
    }
  },
};
