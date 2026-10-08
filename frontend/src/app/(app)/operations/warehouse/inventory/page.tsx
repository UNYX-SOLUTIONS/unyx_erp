import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductTable } from '@/features/inventory/components/ProductTable';

export const metadata: Metadata = {
  title: 'Inventario',
};

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Productos</h1>
          <p className="text-muted-foreground">Gestiona tu catálogo de productos</p>
        </div>
        <Button asChild>
          <Link href="/operations/warehouse/inventory/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo producto
          </Link>
        </Button>
      </div>
      <ProductTable />
    </div>
  );
}
