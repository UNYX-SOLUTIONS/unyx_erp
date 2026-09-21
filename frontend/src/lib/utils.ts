import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { AxiosError } from 'axios';
import type { ApiErrorBody } from '@/types/api-types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Ocurrió un error inesperado'
): string {
  const axiosError = error as AxiosError<ApiErrorBody>;
  return axiosError?.response?.data?.message ?? fallback;
}
