"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, useFirebase } from "@/lib/firebase";
import { demoAuth } from "@/lib/demoAuth";
import { useRouter } from "next/navigation";
import BottleSpinner from "@/components/Loading/BottleSpinner";
import { useUserProfile } from "@/lib/hooks/useUserProfile";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { loading: profileLoading } = useUserProfile();

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
        if (mounted) setLoading(false);
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

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-apple-bg">
        <BottleSpinner />
      </div>
    );
  }

  return <>{children}</>;
}
