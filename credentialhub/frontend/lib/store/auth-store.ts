import { create } from "zustand";

import type { SessionUser } from "@/lib/auth";

type AuthState = {
  user: SessionUser | null;
  setUser: (user: SessionUser) => void;
  clearUser: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));