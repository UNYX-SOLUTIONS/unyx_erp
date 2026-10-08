'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updateVariant } from '../api/products.api';
import type { UpdateVariantPayload } from '../types/product.types';

interface UpdateVariantVariables {
  variantId: string;
  payload: UpdateVariantPayload;
}

export function useUpdateVariant(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ variantId, payload }: UpdateVariantVariables) =>
      updateVariant(productId, variantId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['product', productId] });
      void queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: () => {
      toast.error('No se pudo actualizar la variante');
    },
  });
}
