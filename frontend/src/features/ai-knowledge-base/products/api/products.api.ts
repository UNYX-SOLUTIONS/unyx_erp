import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api-types';
import type {
  CreateProductPayload,
  ProductDto,
  ProductListParams,
  UpdateProductPayload,
} from '../types/product.types';

export async function listProducts(params: ProductListParams): Promise<ApiResponse<ProductDto[]>> {
  const response = await apiClient.get<ApiResponse<ProductDto[]>>('/api/v1/products', { params });
  return response.data;
}

export async function getProductById(id: string): Promise<ApiResponse<ProductDto>> {
  const response = await apiClient.get<ApiResponse<ProductDto>>(`/api/v1/products/${id}`);
  return response.data;
}

export async function createProduct(
  payload: CreateProductPayload
): Promise<ApiResponse<ProductDto>> {
  const response = await apiClient.post<ApiResponse<ProductDto>>('/api/v1/products', payload);
  return response.data;
}

export async function updateProduct(
  id: string,
  payload: UpdateProductPayload
): Promise<ApiResponse<ProductDto>> {
  const response = await apiClient.patch<ApiResponse<ProductDto>>(
    `/api/v1/products/${id}`,
    payload
  );
  return response.data;
}

export async function deleteProduct(id: string): Promise<ApiResponse<ProductDto>> {
  const response = await apiClient.delete<ApiResponse<ProductDto>>(`/api/v1/products/${id}`);
  return response.data;
}
