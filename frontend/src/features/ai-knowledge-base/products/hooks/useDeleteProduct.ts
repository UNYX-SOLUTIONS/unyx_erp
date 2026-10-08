'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { deleteProduct } from '../api/products.api';

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Producto eliminado');
    },
    onError: () => {
      toast.error('No se pudo eliminar el producto');
    },
  });
}
