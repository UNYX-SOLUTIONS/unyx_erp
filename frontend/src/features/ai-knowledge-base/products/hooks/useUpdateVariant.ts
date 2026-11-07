'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/utils';
import { updateVariant } from '../api/products.api';
import type { UpdateVariantPayload } from '../types/product.types';
import { markProductsListStale, mergeVariantIntoProductCache } from './product-cache';

interface UpdateVariantVariables {
  variantId: string;
  payload: UpdateVariantPayload;
}

export function useUpdateVariant(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ variantId, payload }: UpdateVariantVariables) =>
      updateVariant(productId, variantId, payload),
    onSuccess: (response) => {
      mergeVariantIntoProductCache(queryClient, productId, response.data);
      markProductsListStale(queryClient);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo actualizar la variante'));
    },
  });
}
