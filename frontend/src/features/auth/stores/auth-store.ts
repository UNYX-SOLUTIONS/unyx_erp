import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SafeUser, CompanySummary, AuthTokens } from '../types/auth-types';

interface AuthState {
  user: SafeUser | null;
  company: CompanySummary | null;
  permissions: string[];
  accessToken: string | null;
  refreshToken: string | null;
  isHydrated: boolean;
  setSession: (user: SafeUser, tokens: AuthTokens) => void;
  setUser: (user: SafeUser, company: CompanySummary, permissions: string[]) => void;
  clearSession: () => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      company: null,
      permissions: [],
      accessToken: null,
      refreshToken: null,
      isHydrated: false,
      setSession: (user, tokens) =>
        set({ user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }),
      setUser: (user, company, permissions) => set({ user, company, permissions }),
      clearSession: () =>
        set({ user: null, company: null, permissions: [], accessToken: null, refreshToken: null }),
      setHydrated: (isHydrated) => set({ isHydrated }),
    }),
    {
      name: 'unyx-auth',
      partialize: (state) => ({
        user: state.user,
        company: state.company,
        permissions: state.permissions,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
