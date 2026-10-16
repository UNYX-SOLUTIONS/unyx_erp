'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { uploadVariantImage } from '../api/products.api';

export function useUploadVariantImage() {
  return useMutation({
    mutationFn: (file: File) => uploadVariantImage(file),
    onError: () => {
      toast.error('No se pudo subir la imagen');
    },
  });
}
