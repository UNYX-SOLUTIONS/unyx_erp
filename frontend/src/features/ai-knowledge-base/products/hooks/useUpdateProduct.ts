'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updateProduct } from '../api/products.api';
import type { UpdateProductPayload } from '../types/product.types';

export function useUpdateProduct(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProductPayload) => updateProduct(id, payload),
    onSuccess: (response) => {
      queryClient.setQueryData(['product', id], response);
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Cambios guardados');
    },
    onError: () => {
      toast.error('No se pudieron guardar los cambios');
    },
  });
}
