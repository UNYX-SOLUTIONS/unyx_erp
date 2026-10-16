'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/utils';
import { uploadVariantImage } from '../api/products.api';

export function useUploadVariantImage() {
  return useMutation({
    mutationFn: (file: File) => uploadVariantImage(file),
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'No se pudo subir la imagen'));
    },
  });
}
