import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { siteConfig } from '@/config/site';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import type { ApiResponse } from '@/types/api-types';
import type { AuthResponse } from '@/features/auth/types/auth-types';

export const apiClient = axios.create({
  baseURL: siteConfig.apiUrl,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const { refreshToken } = useAuthStore.getState();
  if (!refreshToken) {
    throw new Error('Sin refresh token disponible');
  }
  const response = await axios.post<ApiResponse<AuthResponse>>(
    `${siteConfig.apiUrl}/api/v1/auth/refresh`,
    { refreshToken }
  );
  useAuthStore.getState().setSession(response.data.data.user, response.data.data.tokens);
  return response.data.data.tokens.accessToken;
}

apiClient.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const isAuthRoute = original?.url?.includes('/auth/') ?? false;

    if (error.response?.status === 401 && original && !original._retry && !isAuthRoute) {
      original._retry = true;
      try {
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
        const newAccessToken = await refreshPromise;
        original.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(original);
      } catch {
        useAuthStore.getState().clearSession();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);
