'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/utils';
import {
  getExternalHealth,
  repairExternalMapping,
} from '../api/products.api';
import type { ExternalRepairInput } from '../types/product.types';

export function useExternalHealth() {
  return useQuery({
    queryKey: ['external-health'],
    queryFn: () => getExternalHealth(),
    staleTime: 120_000,
    refetchOnWindowFocus: false,
  });
}

export function useRefreshExternalHealth() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => getExternalHealth({ refresh: true }),
    onSuccess: (response) => {
      queryClient.setQueryData(['external-health'], response);
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, 'No se pudo revalidar la salud de los mapeos')
      );
    },
  });
}

export function useRepairExternalMapping() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ExternalRepairInput) => repairExternalMapping(input),
    onSuccess: (_response, input) => {
      const label =
        input.action === 'unmap'
          ? 'Mapeo eliminado'
          : input.source === 'meta'
            ? 'Variante republicada en Meta'
            : input.action === 'reactivate'
              ? 'Variante reactivada en Contifico'
              : 'Variante recreada en Contifico';
      toast.success(label);
      void queryClient.invalidateQueries({ queryKey: ['external-health'] });
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      void queryClient.invalidateQueries({ queryKey: ['product'] });
      void queryClient.invalidateQueries({ queryKey: ['external-pending'] });
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, 'No se pudo reparar el mapeo externo')
      );
    },
  });
}
