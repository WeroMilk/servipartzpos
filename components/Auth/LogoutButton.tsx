"use client";

import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth as firebaseAuth } from "@/lib/firebase";
import { auth } from "@/lib/auth";
import { storeStore } from "@/lib/storeStore";
import { LogOut } from "lucide-react";

interface LogoutButtonProps {
  className?: string;
  /** Muestra el texto "Salir" (en desktop por defecto visible) */
  showText?: boolean;
  /** En menú móvil: forzar que el texto se vea siempre */
  alwaysShowText?: boolean;
}

export default function LogoutButton({ className = "", showText = true, alwaysShowText = false }: LogoutButtonProps) {
  const router = useRouter();

  const handleLogout = async () => {
    auth.clearProfile();
    await signOut(firebaseAuth);
    storeStore.clearStore();
    router.push("/");
  };

  return (
    <button
      onClick={handleLogout}
      className={`flex items-center gap-1.5 min-[380px]:gap-2 px-3 min-[380px]:px-4 py-2 text-red-600 hover:text-white hover:bg-red-600 transition-all rounded-xl border border-red-600 flex-shrink-0 touch-manipulation min-h-[44px] min-[380px]:min-h-0 ${className}`}
      aria-label="Salir"
    >
      <LogOut className="w-4 h-4 shrink-0" />
      {showText && (
        <span className={`text-xs font-medium ${alwaysShowText ? "inline" : "hidden min-[380px]:inline"} ${alwaysShowText ? "min-[380px]:text-sm" : "min-[380px]:text-sm"}`}>
          Salir
        </span>
      )}
    </button>
  );
}
