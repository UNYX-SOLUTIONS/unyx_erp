'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { buildProductListResponse, fetchAllProducts } from '../api/products.api';
import type { ProductListParams } from '../types/product.types';

export function useProducts(params: ProductListParams) {
  const query = useQuery({
    queryKey: ['products', 'all'],
    queryFn: fetchAllProducts,
    staleTime: 30_000,
  });

  const data = useMemo(
    () => (query.data ? buildProductListResponse(query.data, params) : undefined),
    [query.data, params]
  );

  return { ...query, data };
}
