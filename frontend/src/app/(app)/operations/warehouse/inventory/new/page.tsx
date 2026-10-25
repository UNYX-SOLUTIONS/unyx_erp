'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProductDetailStore } from '@/features/ai-knowledge-base/products/stores/product-detail-store';

export default function NewProductPage() {
  const router = useRouter();
  const openCreate = useProductDetailStore((state) => state.openCreate);

  useEffect(() => {
    openCreate();
    router.replace('/operations/warehouse/inventory');
  }, [openCreate, router]);

  return null;
}
