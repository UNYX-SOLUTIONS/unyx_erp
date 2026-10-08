import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductDetailSheet } from '@/features/ai-knowledge-base/products/components/detail/ProductDetailSheet';
import { ProductsSummaryIndicators } from '@/features/ai-knowledge-base/products/components/ProductsSummaryIndicators';
import { ProductsTable } from '@/features/ai-knowledge-base/products/components/ProductsTable';

export const metadata: Metadata = {
  title: 'Productos · Base de conocimiento IA',
};

export default function KnowledgeProductsPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-slate-100">Productos</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            Administra la información de productos y variantes disponible para el asistente
            comercial.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <ProductsSummaryIndicators />
          <Button asChild className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700">
            <Link href="/operations/warehouse/inventory/new">
              <Plus className="h-4 w-4" />
              Nuevo producto
            </Link>
          </Button>
        </div>
      </div>

      <ProductsTable />

      <ProductDetailSheet />
    </div>
  );
}
