'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/utils';
import { addVariant } from '../api/products.api';
import type { CreateVariantPayload } from '../types/product.types';

export function useAddVariant(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateVariantPayload) => addVariant(productId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['product', productId] });
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Variante agregada');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo agregar la variante'));
    },
  });
}
