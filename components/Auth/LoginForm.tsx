"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth as firebaseAuth } from "@/lib/firebase";
import { auth } from "@/lib/auth";
import { getUserProfile, setUserProfile } from "@/lib/firestore";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const fullEmail = email.includes("@") ? email.trim() : `${email.trim()}@servipartz.com`;

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(firebaseAuth, fullEmail, password);
      } else {
        await createUserWithEmailAndPassword(firebaseAuth, fullEmail, password);
      }
      await firebaseAuth.authStateReady();
      const user = firebaseAuth.currentUser;
      if (!user) {
        setError("Error al obtener el usuario");
        return;
      }

      let profile = await getUserProfile(user.uid);
      if (!profile) {
        await setUserProfile(user.uid, {
          email: user.email ?? fullEmail,
          name: user.displayName ?? user.email?.split("@")[0] ?? fullEmail.split("@")[0],
          role: "store_user",
          storeIds: [],
        });
        profile = {
          email: user.email ?? fullEmail,
          name: user.displayName ?? user.email?.split("@")[0],
          role: "store_user",
          storeIds: [],
        };
      }
      auth.setProfile(profile);
      router.push(profile.role === "admin" ? "/stores" : "/select-store");
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? "";
      const messages: Record<string, string> = {
        "auth/invalid-credential": "Contraseña incorrecta",
        "auth/invalid-email": "Correo electrónico no válido",
        "auth/email-already-in-use": "Este correo ya está registrado",
        "auth/weak-password": "La contraseña debe tener al menos 6 caracteres",
        "auth/too-many-requests": "Demasiados intentos. Intenta más tarde",
        "auth/network-request-failed": "Error de conexión. Revisa tu internet",
        "auth/user-disabled": "Esta cuenta ha sido deshabilitada",
        "permission-denied": "Sin permisos. Revisa las reglas de Firestore (colección users).",
      };
      const msg = err instanceof Error ? err.message : "";
      if (msg.toLowerCase().includes("permission") || code === "permission-denied") {
        setError(messages["permission-denied"] ?? msg);
      } else {
        setError(messages[code] || msg || "Error al autenticar");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-[100dvh] min-h-screen flex items-center justify-center px-8 py-4 sm:px-6 sm:py-4 bg-apple-bg safe-area-x overflow-hidden"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="login-orb-1 absolute w-[min(80vw,320px)] h-[min(80vw,320px)] rounded-full bg-primary-600 opacity-[0.28] blur-[80px] -left-[10%] top-[5%]" />
        <div className="login-orb-2 absolute w-[min(60vw,260px)] h-[min(60vw,260px)] rounded-full bg-primary-700 opacity-[0.32] blur-[70px] right-[0%] top-[30%]" />
        <div className="login-orb-3 absolute w-[min(70vw,280px)] h-[min(70vw,280px)] rounded-full bg-primary-600 opacity-[0.26] blur-[90px] left-[20%] bottom-[10%]" />
        <div className="login-orb-4 absolute w-[min(50vw,220px)] h-[min(50vw,220px)] rounded-full bg-primary-600 opacity-[0.28] blur-[60px] right-[15%] bottom-[25%]" />
        <div className="login-orb-5 absolute w-[min(55vw,240px)] h-[min(55vw,240px)] rounded-full bg-primary-500 opacity-[0.30] blur-[75px] left-[5%] top-[40%]" />
        <div className="login-orb-6 absolute w-[min(65vw,270px)] h-[min(65vw,270px)] rounded-full bg-primary-600 opacity-[0.24] blur-[85px] right-[25%] top-[10%]" />
      </div>

      <div className="relative z-10 w-full max-w-md min-w-0 mx-auto -mt-16 sm:mt-0">
        <div className="bg-apple-surface/95 backdrop-blur-sm rounded-3xl shadow-xl border border-apple-border p-6 sm:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl font-semibold text-primary-600 mb-2">SERVIPARTZ POS</h1>
            <p className="text-apple-text2">Repuestos de electrodomésticos · Multi-tienda</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-apple-text mb-2">
                Usuario
              </label>
              <div className="flex items-center gap-2 px-4 py-3 bg-apple-surface2 border border-apple-border rounded-xl focus-within:ring-2 focus-within:ring-apple-accent focus-within:border-transparent transition-all">
                <input
                  id="login-email"
                  name="email"
                  type="text"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 min-w-0 bg-transparent text-apple-text placeholder-apple-text2 focus:outline-none"
                  placeholder="usuario"
                />
                <span className="text-apple-text2 text-sm shrink-0">@servipartz.com</span>
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-apple-text mb-2">
                Contraseña
              </label>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-apple-surface2 border border-apple-border rounded-xl text-apple-text placeholder-apple-text2 focus:outline-none focus:ring-2 focus:ring-apple-accent focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-apple-accent hover:bg-apple-accent/90 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Cargando..." : isLogin ? "Iniciar Sesión" : "Registrarse"}
            </button>
          </form>

          <footer className="mt-6 pt-4 border-t border-apple-border">
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] text-apple-text2">
              <a href="/legal/privacidad" className="hover:text-apple-accent transition-colors">
                Política de Privacidad
              </a>
              <a href="/legal/cookies" className="hover:text-apple-accent transition-colors">
                Cookies
              </a>
              <a href="/legal/aviso-legal" className="hover:text-apple-accent transition-colors">
                Aviso Legal
              </a>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
