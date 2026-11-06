'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updateProduct } from '../api/products.api';
import type { UpdateProductPayload } from '../types/product.types';
import { markProductsListStale } from './product-cache';

export function useUpdateProduct(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProductPayload) => updateProduct(id, payload),
    onSuccess: (response) => {
      queryClient.setQueryData(['product', id], response);
      markProductsListStale(queryClient);
      toast.success('Cambios guardados');
    },
    onError: () => {
      toast.error('No se pudieron guardar los cambios');
    },
  });
}
