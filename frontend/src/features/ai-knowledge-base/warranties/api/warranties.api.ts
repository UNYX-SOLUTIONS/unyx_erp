import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api-types';
import type { WarrantyDto, WarrantyPayload } from '../types/warranty.types';

const BASE = '/api/v1/integrations/altosa';

export async function listWarranties(params?: {
  active?: 'all' | boolean;
}): Promise<ApiResponse<WarrantyDto[]>> {
  const active = params?.active ?? 'all';
  const response = await apiClient.get<ApiResponse<WarrantyDto[]>>(
    `${BASE}/warranties`,
    {
      params: {
        active: active === 'all' ? 'all' : active ? 'true' : 'false',
      },
    }
  );
  return response.data;
}

export async function createWarranty(
  payload: WarrantyPayload
): Promise<ApiResponse<WarrantyDto>> {
  const response = await apiClient.post<ApiResponse<WarrantyDto>>(
    `${BASE}/warranties`,
    payload
  );
  return response.data;
}

export async function updateWarranty(
  id: number,
  payload: WarrantyPayload
): Promise<ApiResponse<WarrantyDto>> {
  const response = await apiClient.patch<ApiResponse<WarrantyDto>>(
    `${BASE}/warranties/${id}`,
    payload
  );
  return response.data;
}

export async function deleteWarranty(
  id: number
): Promise<ApiResponse<{ id: number; deleted: boolean }>> {
  const response = await apiClient.delete<
    ApiResponse<{ id: number; deleted: boolean }>
  >(`${BASE}/warranties/${id}`);
  return response.data;
}
