'use client';

import Link from 'next/link';
import { ArrowLeft, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useProduct } from '@/features/inventory/hooks/useProducts';
import { formatCurrency, formatDate } from '@/lib/formatters';

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const { data, isLoading, isError } = useProduct(params.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon">
          <Link href="/operations/warehouse/inventory">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Detalle de producto</h1>
          <p className="text-muted-foreground">Vista individual del producto</p>
        </div>
      </div>

      {isLoading && (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      )}

      {isError && (
        <Card>
          <CardContent className="p-6 text-muted-foreground">
            No se pudo cargar el producto.
          </CardContent>
        </Card>
      )}

      {data?.data && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>{data.data.name}</CardTitle>
                <CardDescription>SKU: {data.data.sku}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Precio de venta</p>
              <p className="font-semibold">{formatCurrency(data.data.salePrice)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Precio de costo</p>
              <p className="font-semibold">{formatCurrency(data.data.costPrice)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Creado</p>
              <p className="font-semibold">{formatDate(data.data.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estado</p>
              <p className="font-semibold">{data.data.isActive ? 'Activo' : 'Inactivo'}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
