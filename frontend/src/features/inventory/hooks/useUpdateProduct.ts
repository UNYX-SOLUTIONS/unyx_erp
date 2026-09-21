'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { productsApi } from '../api/products-api';
import { QUERY_KEYS } from '@/lib/constants';
import type { UpdateProductInput } from '../types/product-types';

export function useUpdateProduct(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateProductInput) => productsApi.update(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
      toast.success('Producto actualizado');
    },
    onError: () => {
      toast.error('No se pudo actualizar el producto');
    },
  });
}
