'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/utils';
import { createProduct } from '../api/products.api';
import type { CreateProductPayload } from '../types/product.types';
import { markProductsListStale } from './product-cache';

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProductPayload) => createProduct(payload),
    onSuccess: () => {
      markProductsListStale(queryClient);
      void queryClient.invalidateQueries({
        queryKey: ['external-pending'],
        refetchType: 'none',
      });
      toast.success('Producto creado');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo crear el producto'));
    },
  });
}
