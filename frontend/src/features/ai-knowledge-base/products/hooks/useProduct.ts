'use client';

import { useQuery } from '@tanstack/react-query';
import { getProductById } from '../api/products.api';

export function useProduct(id: string | null | undefined) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => getProductById(id as string),
    enabled: Boolean(id),
  });
}
