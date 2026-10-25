'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/utils';
import { updateVariant } from '../api/products.api';
import type { UpdateVariantPayload } from '../types/product.types';

interface UpdateMetaMappingVariables {
  variantId: string;
  payload: UpdateVariantPayload;
}

export function useUpdateVariantMetaMapping(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ variantId, payload }: UpdateMetaMappingVariables) =>
      updateVariant(productId, variantId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, 'No se pudo actualizar el mapeo del catálogo de Meta')
      );
    },
  });
}
