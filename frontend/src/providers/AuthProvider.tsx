'use client';

import { useEffect } from 'react';
import { authApi } from '@/features/auth/api/auth-api';
import { useAuthStore } from '@/features/auth/stores/auth-store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const clearSession = useAuthStore((state) => state.clearSession);

  useEffect(() => {
    if (!isHydrated || !accessToken || user) {
      return;
    }
    authApi
      .me()
      .then((response) => {
        setUser(response.data.user, response.data.company, response.data.permissions);
      })
      .catch(() => {
        clearSession();
      });
  }, [isHydrated, accessToken, user, setUser, clearSession]);

  return <>{children}</>;
}
