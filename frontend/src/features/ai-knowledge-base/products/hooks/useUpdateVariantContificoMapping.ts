'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/utils';
import { updateVariant } from '../api/products.api';
import type { UpdateVariantPayload } from '../types/product.types';

interface UpdateContificoMappingVariables {
  variantId: string;
  payload: UpdateVariantPayload;
}

export function useUpdateVariantContificoMapping(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ variantId, payload }: UpdateContificoMappingVariables) =>
      updateVariant(productId, variantId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['product', productId] });
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      void queryClient.invalidateQueries({ queryKey: ['external-pending'] });
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, 'No se pudo actualizar el mapeo de Contifico')
      );
    },
  });
}
