import type { Metadata } from 'next';
import { ProductForm } from '@/features/inventory/components/ProductForm';

export const metadata: Metadata = {
  title: 'Nuevo producto',
};

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nuevo producto</h1>
        <p className="text-muted-foreground">Completa la información del producto</p>
      </div>
      <div className="max-w-2xl">
        <ProductForm />
      </div>
    </div>
  );
}
