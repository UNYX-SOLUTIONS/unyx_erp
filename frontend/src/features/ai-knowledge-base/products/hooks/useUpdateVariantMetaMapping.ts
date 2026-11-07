'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/utils';
import { updateVariant } from '../api/products.api';
import type { UpdateVariantPayload } from '../types/product.types';
import { markProductsListStale, mergeVariantIntoProductCache } from './product-cache';

interface UpdateMetaMappingVariables {
  variantId: string;
  payload: UpdateVariantPayload; //Comentario
}

export function useUpdateVariantMetaMapping(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ variantId, payload }: UpdateMetaMappingVariables) =>
      updateVariant(productId, variantId, payload),
    onSuccess: (response) => {
      mergeVariantIntoProductCache(queryClient, productId, response.data);
      markProductsListStale(queryClient);
      void queryClient.invalidateQueries({
        queryKey: ['external-pending'],
        refetchType: 'none',
      });
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, 'No se pudo actualizar el mapeo del catálogo de Meta')
      );
    },
  });
}
