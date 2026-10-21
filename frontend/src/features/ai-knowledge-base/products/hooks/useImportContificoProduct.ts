'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/utils';
import { importContificoProduct } from '../api/products.api';

export function useImportContificoProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: importContificoProduct,
    onSuccess: (response) => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      void queryClient.invalidateQueries({ queryKey: ['product'] });
      toast.success(`Producto agregado desde Contifico: ${response.data.name}`);
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, 'No se pudo agregar el producto desde Contifico')
      );
    },
  });
}
