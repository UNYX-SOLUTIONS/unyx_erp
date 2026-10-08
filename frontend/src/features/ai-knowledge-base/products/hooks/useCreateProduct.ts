'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createProduct } from '../api/products.api';
import type { CreateProductPayload } from '../types/product.types';

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProductPayload) => createProduct(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Producto creado');
    },
    onError: () => {
      toast.error('No se pudo crear el producto');
    },
  });
}
