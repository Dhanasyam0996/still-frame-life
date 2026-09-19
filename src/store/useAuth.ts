import { create } from "zustand";

import type { User } from "@/types/cadastre";

const KEY = "cadastre.session";

interface AuthState {
  user: User | null;
  hydrated: boolean;
  hydrate: () => void;
  signIn: (role: User["role"], displayName?: string) => User;
  signOut: () => void;
  canMutate: () => boolean;
}

const NAMES: Record<User["role"], string> = {
  admin: "Demo Admin",
  surveyor: "Demo Surveyor",
  viewer: "Demo Viewer",
};

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  hydrated: false,
  hydrate: () => {
    if (get().hydrated) return;
    let user: User | null = null;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) user = JSON.parse(raw) as User;
    } catch {
      user = null;
    }
    set({ user, hydrated: true });
  },
  signIn: (role, displayName) => {
    const user: User = {
      id: `USR-${role.toUpperCase()}`,
      role,
      displayName: displayName || NAMES[role],
    };
    try {
      localStorage.setItem(KEY, JSON.stringify(user));
    } catch {
      /* ignore */
    }
    set({ user, hydrated: true });
    return user;
  },
  signOut: () => {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    set({ user: null });
  },
  canMutate: () => {
    const role = get().user?.role;
    return role === "admin" || role === "surveyor";
  },
}));

/** UI-level role demonstration only — not real security. */
export function roleCanMutate(role: User["role"] | undefined): boolean {
  return role === "admin" || role === "surveyor";
}
