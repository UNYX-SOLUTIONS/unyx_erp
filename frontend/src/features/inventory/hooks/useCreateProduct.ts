'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { productsApi } from '../api/products-api';
import { QUERY_KEYS } from '@/lib/constants';
import type { CreateProductInput } from '../types/product-types';

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProductInput) => productsApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
      toast.success('Producto creado');
    },
    onError: () => {
      toast.error('No se pudo crear el producto');
    },
  });
}
