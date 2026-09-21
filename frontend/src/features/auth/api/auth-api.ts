import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api-types';
import type { AuthResponse, MeResponse } from '../types/auth-types';
import type { LoginInput, RegisterInput } from '../schemas/auth-schema';

export const authApi = {
  login: async (input: LoginInput) => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/api/v1/auth/login', input);
    return response.data;
  },

  register: async (input: RegisterInput) => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      '/api/v1/auth/register',
      input
    );
    return response.data;
  },

  refresh: async (refreshToken: string) => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/api/v1/auth/refresh', {
      refreshToken,
    });
    return response.data;
  },

  logout: async (refreshToken: string) => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>('/api/v1/auth/logout', {
      refreshToken,
    });
    return response.data;
  },

  me: async () => {
    const response = await apiClient.get<ApiResponse<MeResponse>>('/api/v1/auth/me');
    return response.data;
  },
};
