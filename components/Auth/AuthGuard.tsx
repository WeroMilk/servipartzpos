"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, useFirebase } from "@/lib/firebase";
import { getUserProfile, setUserProfile } from "@/lib/firestore";
import { demoAuth } from "@/lib/demoAuth";
import { useRouter } from "next/navigation";
import BottleSpinner from "@/components/Loading/BottleSpinner";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (useFirebase && auth) {
      // Usar Firebase real: cargar perfil de Firestore
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (!user) {
          demoAuth.clearFirebaseProfile();
          router.push("/");
          return;
        }
        try {
          let profile = await getUserProfile(user.uid);
          if (!profile) {
            // Crear perfil por defecto para usuarios nuevos
            profile = {
              email: user.email ?? "",
              name: user.displayName ?? user.email?.split("@")[0],
              role: "store_user",
              storeIds: ["default"],
            };
            await setUserProfile(user.uid, profile);
          }
          demoAuth.setFirebaseProfile(profile);
        } catch (e) {
          console.error("Error cargando perfil:", e);
          demoAuth.clearFirebaseProfile();
          router.push("/");
          return;
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Usar modo demo
      const checkDemoAuth = () => {
        if (demoAuth.isAuthenticated()) {
          setLoading(false);
        } else {
          router.push("/");
        }
      };
      
      // Verificar inmediatamente
      checkDemoAuth();
      
      // También verificar cuando cambie el localStorage (por si se hace logout en otra pestaña)
      const handleStorageChange = () => {
        checkDemoAuth();
      };
      
      window.addEventListener("storage", handleStorageChange);
      return () => window.removeEventListener("storage", handleStorageChange);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-apple-bg">
        <BottleSpinner />
      </div>
    );
  }

  return <>{children}</>;
}
