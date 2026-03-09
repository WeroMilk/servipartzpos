"use client";

import { useEffect } from "react";

/** Solo registra el service worker para que la PWA sea instalable. Sin botón: el usuario usa el de Chrome (barra de direcciones). */
export default function PWAInstall() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  return null;
}
