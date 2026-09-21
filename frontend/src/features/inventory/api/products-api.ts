import { apiClient } from '@/lib/api-client';
import type { ApiResponse, PaginationParams } from '@/types/api-types';
import type { CreateProductInput, Product, UpdateProductInput } from '../types/product-types';

export const productsApi = {
  list: async (params?: PaginationParams) => {
    const response = await apiClient.get<ApiResponse<Product[]>>('/api/v1/products', {
      params,
    });
    return response.data;
  },

  get: async (id: string) => {
    const response = await apiClient.get<ApiResponse<Product>>(`/api/v1/products/${id}`);
    return response.data;
  },

  create: async (input: CreateProductInput) => {
    const response = await apiClient.post<ApiResponse<Product>>('/api/v1/products', input);
    return response.data;
  },

  update: async (id: string, input: UpdateProductInput) => {
    const response = await apiClient.patch<ApiResponse<Product>>(`/api/v1/products/${id}`, input);
    return response.data;
  },

  remove: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<{ id: string }>>(`/api/v1/products/${id}`);
    return response.data;
  },
};
