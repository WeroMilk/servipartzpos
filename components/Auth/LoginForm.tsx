"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, useFirebase } from "@/lib/firebase";
import { demoAuth, DEMO_USERS } from "@/lib/demoAuth";
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

    try {
      if (useFirebase && auth) {
        try {
          // Usar Firebase real
          if (isLogin) {
            await signInWithEmailAndPassword(auth, email, password);
          } else {
            await createUserWithEmailAndPassword(auth, email, password);
          }
        } catch (firebaseErr: any) {
          // Si Firebase Auth no está configurado (auth/configuration-not-found), usar demo
          if (firebaseErr?.code === "auth/configuration-not-found") {
            await demoAuth.signIn(email, password);
          } else {
            throw firebaseErr;
          }
        }
      } else {
        // Usar modo demo
        if (isLogin) {
          await demoAuth.signIn(email, password);
        } else {
          await demoAuth.signUp(email, password);
        }
      }
      router.push("/select-store");
    } catch (err: any) {
      setError(err.message || "Error al autenticar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-[100dvh] min-h-screen flex items-center justify-center px-8 py-4 sm:px-6 sm:py-4 bg-apple-bg safe-area-x overflow-hidden"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {/* Sombras azul/rojo estilo Servipartz */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="login-orb-1 absolute w-[min(80vw,320px)] h-[min(80vw,320px)] rounded-full bg-primary-600 opacity-20 blur-[80px] -left-[10%] top-[5%]" />
        <div className="login-orb-2 absolute w-[min(60vw,260px)] h-[min(60vw,260px)] rounded-full bg-primary-700 opacity-25 blur-[70px] right-[0%] top-[30%]" />
        <div className="login-orb-3 absolute w-[min(70vw,280px)] h-[min(70vw,280px)] rounded-full bg-accent-red opacity-[0.15] blur-[90px] left-[20%] bottom-[10%]" />
        <div className="login-orb-4 absolute w-[min(50vw,220px)] h-[min(50vw,220px)] rounded-full bg-primary-600 opacity-20 blur-[60px] right-[15%] bottom-[25%]" />
        <div className="login-orb-5 absolute w-[min(55vw,240px)] h-[min(55vw,240px)] rounded-full bg-primary-500 opacity-[0.18] blur-[75px] left-[5%] top-[40%]" />
        <div className="login-orb-6 absolute w-[min(65vw,270px)] h-[min(65vw,270px)] rounded-full bg-accent-red opacity-[0.12] blur-[85px] right-[25%] top-[10%]" />
      </div>

      <div className="relative z-10 w-full max-w-md min-w-0 mx-auto -mt-16 sm:mt-0">
        <div className="bg-apple-surface/95 backdrop-blur-sm rounded-3xl shadow-xl border border-apple-border p-6 sm:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl font-semibold text-primary-600 mb-2">Servipartz POS</h1>
            <p className="text-apple-text2">Repuestos de electrodomésticos · Multi-tienda</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-apple-text mb-2">
                Email
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-apple-surface2 border border-apple-border rounded-xl text-apple-text placeholder-apple-text2 focus:outline-none focus:ring-2 focus:ring-apple-accent focus:border-transparent transition-all"
                placeholder="tu@email.com"
              />
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

          <div className="mt-6 pt-6 border-t border-apple-border">
              <p className="text-xs text-apple-text2 text-center mb-3">
                Usuario de prueba:
              </p>
              <div className="space-y-2">
                {DEMO_USERS.map((user) => (
                  <button
                    key={user.email}
                    onClick={() => {
                      setEmail(user.email);
                      setPassword(user.password);
                      setIsLogin(true);
                    }}
                    className="w-full text-center px-3 py-2 bg-apple-surface2 hover:bg-apple-border/50 rounded-xl text-xs text-apple-text hover:text-apple-accent transition-colors border border-apple-border"
                  >
                    <span className="font-medium">{user.email}</span>
                    <span className="text-apple-text2"> / </span>
                    <span className="font-medium">{user.password}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-apple-text2 text-center mt-3">
                Haz clic en un usuario para autocompletar
              </p>
            </div>
        </div>
      </div>
    </div>
  );
}
