import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api-types';
import type {
  CreateProductPayload,
  CreateVariantPayload,
  ProductDetailDto,
  ProductDto,
  ProductListParams,
  UpdateProductPayload,
  UpdateVariantPayload,
  VariantDto,
} from '../types/product.types';

export async function listProducts(params: ProductListParams): Promise<ApiResponse<ProductDto[]>> {
  const response = await apiClient.get<ApiResponse<ProductDto[]>>('/api/v1/products', { params });
  return response.data;
}

export async function getProductById(id: string): Promise<ApiResponse<ProductDetailDto>> {
  const response = await apiClient.get<ApiResponse<ProductDetailDto>>(`/api/v1/products/${id}`);
  return response.data;
}

export async function createProduct(
  payload: CreateProductPayload
): Promise<ApiResponse<ProductDetailDto>> {
  const response = await apiClient.post<ApiResponse<ProductDetailDto>>('/api/v1/products', payload);
  return response.data;
}

export async function updateProduct(
  id: string,
  payload: UpdateProductPayload
): Promise<ApiResponse<ProductDetailDto>> {
  const response = await apiClient.patch<ApiResponse<ProductDetailDto>>(
    `/api/v1/products/${id}`,
    payload
  );
  return response.data;
}

export async function deleteProduct(id: string): Promise<ApiResponse<ProductDto>> {
  const response = await apiClient.delete<ApiResponse<ProductDto>>(`/api/v1/products/${id}`);
  return response.data;
}

export async function listVariants(productId: string): Promise<ApiResponse<VariantDto[]>> {
  const response = await apiClient.get<ApiResponse<VariantDto[]>>(
    `/api/v1/products/${productId}/variants`
  );
  return response.data;
}

export async function addVariant(
  productId: string,
  payload: CreateVariantPayload
): Promise<ApiResponse<VariantDto>> {
  const response = await apiClient.post<ApiResponse<VariantDto>>(
    `/api/v1/products/${productId}/variants`,
    payload
  );
  return response.data;
}

export async function updateVariant(
  productId: string,
  variantId: string,
  payload: UpdateVariantPayload
): Promise<ApiResponse<VariantDto>> {
  const response = await apiClient.patch<ApiResponse<VariantDto>>(
    `/api/v1/products/${productId}/variants/${variantId}`,
    payload
  );
  return response.data;
}

export async function deleteVariant(
  productId: string,
  variantId: string
): Promise<ApiResponse<VariantDto>> {
  const response = await apiClient.delete<ApiResponse<VariantDto>>(
    `/api/v1/products/${productId}/variants/${variantId}`
  );
  return response.data;
}
