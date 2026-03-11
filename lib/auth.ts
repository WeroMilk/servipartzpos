/**
 * Autenticación de producción: solo Firebase Auth + perfil en Firestore.
 * El perfil (rol, tiendas) se sincroniza en tiempo real desde Firestore.
 */

import { employeeAuth } from "./employeeAuth";
import { listUserProfiles, updateUserStoreIdsByEmail } from "./firestore";
import type { UserProfile } from "./firestore";

let currentProfile: UserProfile | null = null;

export type { UserProfile };

export const auth = {
  /** Establece el perfil actual (llamado por useUserProfile y tras el login). */
  setProfile(profile: UserProfile | null): void {
    currentProfile = profile;
  },

  /** Limpia el perfil (al cerrar sesión). */
  clearProfile(): void {
    currentProfile = null;
  },

  getCurrentUser(): UserProfile | null {
    return currentProfile;
  },

  isAuthenticated(): boolean {
    return currentProfile !== null;
  },

  /** Usuario limitado (vendedor): solo caja, inventario, turnos y devoluciones. */
  isLimitedUser(): boolean {
    const user = currentProfile;
    if (!user) return false;
    return user.role === "store_user";
  },

  /** Usuario admin (gerente): acceso completo. */
  isAdminUser(): boolean {
    const user = currentProfile;
    if (!user) return false;
    return user.role === "admin";
  },

  /** Verifica la contraseña del gerente (para descuentos y autorizar devoluciones). */
  verifyManagerPassword(password: string): boolean {
    const emp = employeeAuth.validate(password);
    if (!emp) return false;
    const full = employeeAuth.getEmployees().find((e) => e.id === emp.id);
    return full?.role === "gerente";
  },

  /** Lista de usuarios (solo admin). Desde Firestore. */
  async getRegisteredUsersForAdmin(): Promise<Omit<UserProfile, "currentStoreId" | "currentStoreName">[]> {
    const list = await listUserProfiles();
    return list.map(({ currentStoreId: _, currentStoreName: __, ...u }) => u);
  },

  /** Actualiza las tiendas asignadas a un usuario por email (solo admin). */
  async updateUserStoreIds(email: string, storeIds: string[]): Promise<void> {
    await updateUserStoreIdsByEmail(email, storeIds.length > 0 ? storeIds : []);
  },
};
