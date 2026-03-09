export type MovementType =
  | "inventory_check_ok"
  | "inventory_check_fail"
  | "inventory_complete"
  | "edit"
  | "portion_change"
  | "inventory_list_updated"
  | "bar_name_change"
  | "employee_password_change"
  | "last_update_date"
  | "sales_import"
  | "order_import"
  | "bottles_reorder"
  | "sort_change";

export interface Movement {
  id: string;
  bottleId: string;
  bottleName: string;
  type: MovementType;
  oldValue?: number;
  newValue: number;
  timestamp: Date;
  userName: string;
  /** Texto descriptivo para movimientos no ligados a una botella concreta */
  description?: string;
}

const UNREAD_KEY = "barra-notifications-unread";

const NOTIFICATIONS_UPDATE_EVENT = "barra-notifications-update";

export const notificationsService = {
  incrementUnread: () => {
    const count = parseInt(localStorage.getItem(UNREAD_KEY) || "0", 10);
    const newCount = count + 1;
    localStorage.setItem(UNREAD_KEY, String(newCount));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(NOTIFICATIONS_UPDATE_EVENT, { detail: newCount }));
    }
    return newCount;
  },
  getUnreadCount: (): number => {
    return parseInt(localStorage.getItem(UNREAD_KEY) || "0", 10);
  },
  markAsRead: () => {
    localStorage.setItem(UNREAD_KEY, "0");
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(NOTIFICATIONS_UPDATE_EVENT, { detail: 0 }));
    }
  },
};

let movements: Movement[] = [];

// Cargar movimientos desde localStorage
if (typeof window !== "undefined") {
  const saved = localStorage.getItem("bottle-movements");
  if (saved) {
    try {
      movements = JSON.parse(saved).map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      }));
    } catch {
      // Ignorar movimientos corruptos en localStorage
    }
  }
}

export const movementsService = {
  add: (movement: Omit<Movement, "id" | "timestamp">) => {
    const newMovement: Movement = {
      ...movement,
      id: `movement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    movements.unshift(newMovement);
    // Mantener solo los últimos 100 movimientos
    if (movements.length > 100) {
      movements = movements.slice(0, 100);
    }
    localStorage.setItem("bottle-movements", JSON.stringify(movements));
    return newMovement;
  },

  getAll: (): Movement[] => {
    return [...movements];
  },

  getByBottle: (bottleId: string): Movement[] => {
    return movements.filter((m) => m.bottleId === bottleId);
  },

  clear: () => {
    movements = [];
    localStorage.removeItem("bottle-movements");
    if (typeof window !== "undefined") {
      notificationsService.markAsRead();
    }
  },
};
