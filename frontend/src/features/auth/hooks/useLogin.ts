'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth-api';
import { useAuthStore } from '../stores/auth-store';
import type { LoginInput } from '../schemas/auth-schema';

export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginInput) =>
      authApi.login({ identifier: input.email, password: input.password }),
    onSuccess: (response) => {
      setSession(response.data.user, response.data.tokens);
      void queryClient.invalidateQueries({ queryKey: ['current-user'] });
    },
  });
}
