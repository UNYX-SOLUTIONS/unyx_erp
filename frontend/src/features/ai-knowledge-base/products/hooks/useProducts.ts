'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { listProducts } from '../api/products.api';
import type { ProductListParams } from '../types/product.types';

export function useProducts(params: ProductListParams) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => listProducts(params),
    placeholderData: keepPreviousData,
  });
}
