"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth as firebaseAuth } from "@/lib/firebase";
import { auth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import BottleSpinner from "@/components/Loading/BottleSpinner";
import { useUserProfile } from "@/lib/hooks/useUserProfile";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { loading: profileLoading } = useUserProfile();

  useEffect(() => {
    let mounted = true;
    let initialCheckDone = false;
    const run = async () => {
      try {
        await firebaseAuth.authStateReady();
        if (!mounted) return;
        if (!firebaseAuth.currentUser) {
          auth.clearProfile();
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
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      if (!initialCheckDone) return;
      if (!user) {
        auth.clearProfile();
        router.push("/");
        return;
      }
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
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
