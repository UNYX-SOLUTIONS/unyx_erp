'use client';

import { useCallback } from 'react';
import { useAuthStore } from '@/features/auth/stores/auth-store';

export function usePermission() {
  const permissions = useAuthStore((state) => state.permissions);
  const user = useAuthStore((state) => state.user);

  const can = useCallback(
    (code: string): boolean => {
      if (user?.isSuperAdmin) {
        return true;
      }
      const [module] = code.split('.');
      return (
        permissions.includes(code) ||
        permissions.includes(`${module}.*`) ||
        permissions.includes('*')
      );
    },
    [permissions, user]
  );

  return { can, permissions };
}
