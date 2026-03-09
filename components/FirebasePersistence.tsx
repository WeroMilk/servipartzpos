"use client";

import { useEffect } from "react";
import { enableIndexedDbPersistence } from "firebase/firestore";
import { db, useFirebase } from "@/lib/firebase";

/** Habilita persistencia offline de Firestore cuando Firebase está configurado. */
export default function FirebasePersistence() {
  useEffect(() => {
    if (useFirebase && db) {
      enableIndexedDbPersistence(db).catch(() => {
        // Puede fallar si hay múltiples pestañas abiertas (solo una puede tener persistencia)
      });
    }
  }, []);
  return null;
}
