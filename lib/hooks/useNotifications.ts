"use client";

import { collection, query, where, orderBy } from "firebase/firestore";
import { db, useFirebase } from "@/lib/firebase";
import { useRealtimeCollection } from "./useRealtimeCollection";

export interface Notification {
  id: string;
  message: string;
  type?: "info" | "warning" | "success" | "error";
  read?: boolean;
  timestamp: Date;
  targetUserId?: string;
  [key: string]: any;
}

export interface UseNotificationsResult {
  notifications: Notification[];
  loading: boolean;
  error: Error | null;
}

/**
 * Hook para escuchar notificaciones de una tienda en tiempo real.
 * Escucha la colección stores/{storeId}/notifications
 * Filtra por notificaciones dirigidas a todos ("all") o a un usuario específico
 */
export function useNotifications(
  storeId: string | null,
  userId?: string
): UseNotificationsResult {
  const cloudEnabled = !!storeId && storeId !== "default" && useFirebase && !!db;

  const { data, loading, error } = useRealtimeCollection<Notification>(
    cloudEnabled,
    () => {
      if (!db) throw new Error("Firestore no inicializado");
      const filters = [
        where(
          "targetUserId",
          "in",
          userId ? [userId, "all"] : ["all"]
        ),
      ];
      return query(
        collection(db, "stores", storeId!, "notifications"),
        ...filters,
        orderBy("timestamp", "desc")
      );
    },
    (snap) => {
      const data = snap.data() as any;
      return {
        id: snap.id,
        message: data.message ?? "",
        type: data.type ?? "info",
        read: data.read ?? false,
        timestamp: data.timestamp?.toDate
          ? data.timestamp.toDate()
          : new Date(data.timestamp),
        targetUserId: data.targetUserId,
      } as Notification;
    }
  );

  return { notifications: data, loading, error };
}
