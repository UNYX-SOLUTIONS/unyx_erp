'use client';

import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/auth-api';
import { useAuthStore } from '../stores/auth-store';
import type { RegisterInput } from '../schemas/auth-schema';

export function useRegister() {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: (input: RegisterInput) => authApi.register(input),
    onSuccess: (response) => {
      setSession(response.data.user, response.data.tokens);
    },
  });
}
