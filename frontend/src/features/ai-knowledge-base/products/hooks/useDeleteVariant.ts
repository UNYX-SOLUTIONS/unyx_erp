'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/utils';
import { deleteVariant } from '../api/products.api';
import { markProductsListStale, mergeVariantIntoProductCache } from './product-cache';

export function useDeleteVariant(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variantId: string) => deleteVariant(productId, variantId),
    onSuccess: (response) => {
      mergeVariantIntoProductCache(queryClient, productId, response.data);
      markProductsListStale(queryClient);
      void queryClient.invalidateQueries({
        queryKey: ['external-health'],
        refetchType: 'none',
      });
      toast.success('Variante anulada');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo anular la variante'));
    },
  });
}
