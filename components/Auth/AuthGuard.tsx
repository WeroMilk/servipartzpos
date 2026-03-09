"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, useFirebase } from "@/lib/firebase";
import { getUserProfile, setUserProfile } from "@/lib/firestore";
import { demoAuth } from "@/lib/demoAuth";
import { useRouter } from "next/navigation";
import BottleSpinner from "@/components/Loading/BottleSpinner";

async function loadFirebaseUserAndProfile(): Promise<boolean> {
  if (!auth?.currentUser) return false;
  const user = auth.currentUser;
  const fallbackProfile = {
    email: user.email ?? "",
    name: user.displayName ?? user.email?.split("@")[0],
    role: "store_user" as const,
    storeIds: ["default"] as string[],
  };
  try {
    let profile = await getUserProfile(user.uid);
    if (!profile) {
      profile = { ...fallbackProfile };
      try {
        await setUserProfile(user.uid, profile);
      } catch {
        // Firestore falló al crear; usar perfil en memoria
      }
    }
    demoAuth.setFirebaseProfile(profile);
    return true;
  } catch (e) {
    console.error("Error cargando perfil de Firestore, usando fallback:", e);
    demoAuth.setFirebaseProfile(fallbackProfile);
    return true;
  }
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (useFirebase && auth) {
      let mounted = true;
      let initialCheckDone = false;
      const run = async () => {
        try {
          await auth.authStateReady();
          if (!mounted) return;
          if (!auth.currentUser) {
            demoAuth.clearFirebaseProfile();
            router.push("/");
            return;
          }
          const ok = await loadFirebaseUserAndProfile();
          if (!mounted) return;
          if (!ok) {
            router.push("/");
            return;
          }
          setLoading(false);
        } catch (e) {
          console.error("AuthGuard error:", e);
          if (mounted) router.push("/");
        } finally {
          initialCheckDone = true;
        }
      };
      run();
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (!initialCheckDone) return;
        if (!user) {
          demoAuth.clearFirebaseProfile();
          router.push("/");
          return;
        }
        const ok = await loadFirebaseUserAndProfile();
        if (mounted && ok) setLoading(false);
      });
      return () => {
        mounted = false;
        unsubscribe();
      };
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
