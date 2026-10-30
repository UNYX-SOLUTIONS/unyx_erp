'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/utils';
import {
  createWarranty,
  deleteWarranty,
  listWarranties,
  updateWarranty,
} from '../api/warranties.api';
import type { WarrantyPayload } from '../types/warranty.types';

export function useWarranties(active: 'all' | boolean = 'all') {
  return useQuery({
    queryKey: ['warranties', active],
    queryFn: () => listWarranties({ active }),
    staleTime: 60_000,
  });
}

export function useCreateWarranty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: WarrantyPayload) => createWarranty(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['warranties'] });
      toast.success('Garantía creada');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo crear la garantía'));
    },
  });
}

export function useUpdateWarranty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: WarrantyPayload }) =>
      updateWarranty(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['warranties'] });
      toast.success('Garantía actualizada');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo actualizar la garantía'));
    },
  });
}

export function useDeleteWarranty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteWarranty(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['warranties'] });
      toast.success('Garantía eliminada');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo eliminar la garantía'));
    },
  });
}
