'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { productsApi } from '../api/products-api';
import { QUERY_KEYS, DEFAULT_PAGE_SIZE } from '@/lib/constants';

export function useProducts(page = 1, limit = DEFAULT_PAGE_SIZE, search?: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.products, page, limit, search],
    queryFn: () => productsApi.list({ page, limit, search }),
    placeholderData: keepPreviousData,
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEYS.products, id],
    queryFn: () => productsApi.get(id as string),
    enabled: Boolean(id),
  });
}

export function useProductPaginationState() {
  return useState({ pageIndex: 1, pageSize: DEFAULT_PAGE_SIZE });
}
