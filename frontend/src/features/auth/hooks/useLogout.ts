'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authApi } from '../api/auth-api';
import { useAuthStore } from '../stores/auth-store';

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const clearSession = useAuthStore((state) => state.clearSession);

  return useMutation({
    mutationFn: async () => {
      if (refreshToken) {
        await authApi.logout(refreshToken).catch(() => undefined);
      }
    },
    onSuccess: () => {
      clearSession();
      queryClient.clear();
      toast.success('Sesión cerrada');
      router.push('/login');
    },
  });
}
