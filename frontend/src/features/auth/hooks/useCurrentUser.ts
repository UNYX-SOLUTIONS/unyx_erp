'use client';

import { useAuthStore } from '../stores/auth-store';

export function useCurrentUser() {
  const user = useAuthStore((state) => state.user);
  const company = useAuthStore((state) => state.company);
  const permissions = useAuthStore((state) => state.permissions);
  const accessToken = useAuthStore((state) => state.accessToken);

  return {
    user,
    company,
    permissions,
    isAuthenticated: Boolean(accessToken),
  };
}
