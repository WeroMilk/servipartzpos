"use client";

import { useEffect } from "react";

/**
 * Sincroniza --app-height con el viewport real en móvil (evita saltos cuando
 * la barra del navegador se muestra/oculta). Uso: 100dvh + esta variable = altura estable.
 */
export default function AppHeightSync() {
  useEffect(() => {
    const setHeight = () => {
      if (typeof window === "undefined") return;
      const h = window.innerHeight;
      document.documentElement.style.setProperty("--app-height", `${h}px`);
    };
    setHeight();
    window.addEventListener("resize", setHeight);
    window.addEventListener("orientationchange", setHeight);
    return () => {
      window.removeEventListener("resize", setHeight);
      window.removeEventListener("orientationchange", setHeight);
    };
  }, []);
  return null;
}
