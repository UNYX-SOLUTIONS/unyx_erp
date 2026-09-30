import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductDetailSheet } from '@/features/ai-knowledge-base/products/components/detail/ProductDetailSheet';
import { ProductsTable } from '@/features/ai-knowledge-base/products/components/ProductsTable';
import { PRODUCTS } from '@/features/ai-knowledge-base/products/data/mock';

export const metadata: Metadata = {
  title: 'Productos · Base de conocimiento IA',
};

export default function KnowledgeProductsPage() {
  const totalProducts = PRODUCTS.length;
  const pendingProducts = PRODUCTS.filter((product) => product.status === 'pending').length;

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Productos</h1>
          <p className="mt-1 text-sm text-gray-500">
            Administra la información de productos y variantes disponible para el asistente
            comercial.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-2 text-sm text-gray-700">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            {totalProducts} productos registrados
          </span>
          <span className="flex items-center gap-2 text-sm text-gray-700">
            <span className="h-2 w-2 rounded-full bg-yellow-400" />
            {pendingProducts} pendientes de revisión
          </span>
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
