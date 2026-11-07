'use client';

import { useQuery } from '@tanstack/react-query';
import { listCategories } from '../api/products.api';

export function useCategories() {
  const query = useQuery({
    queryKey: ['altosa-categories'],
    queryFn: listCategories,
    staleTime: 5 * 60_000,
  });

  return { ...query, data: query.data?.data };
}
