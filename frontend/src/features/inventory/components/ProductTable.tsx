'use client';

import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { AlertCircle, Inbox } from 'lucide-react';
import { DataTable } from '@/components/data-table/DataTable';
import { DataTableColumnHeader } from '@/components/data-table/DataTableColumnHeader';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useProducts } from '../hooks/useProducts';
import type { Product } from '../types/product-types';

export function ProductTable() {
  const { data, isLoading, isError } = useProducts();

  const columns = useMemo<ColumnDef<Product, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nombre" />,
      },
      {
        accessorKey: 'sku',
        header: ({ column }) => <DataTableColumnHeader column={column} title="SKU" />,
        cell: ({ row }) => <span className="font-mono text-sm">{row.original.sku}</span>,
      },
      {
        accessorKey: 'salePrice',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Precio venta" />,
        cell: ({ row }) => formatCurrency(row.original.salePrice),
      },
      {
        accessorKey: 'isActive',
        header: 'Estado',
        cell: ({ row }) =>
          row.original.isActive ? (
            <Badge variant="success">Activo</Badge>
          ) : (
            <Badge variant="secondary">Inactivo</Badge>
          ),
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Creado" />,
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
    ],
    []
  );

  if (isLoading) {
    return <p className="py-8 text-center text-muted-foreground">Cargando productos...</p>;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-md border border-dashed p-8 text-center">
        <AlertCircle className="h-8 w-8 text-muted-foreground" />
        <p className="text-muted-foreground">No se pudieron cargar los productos.</p>
      </div>
    );
  }

  const products = data?.data ?? [];

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-md border border-dashed p-8 text-center">
        <Inbox className="h-8 w-8 text-muted-foreground" />
        <p className="text-muted-foreground">Aún no hay productos registrados.</p>
      </div>
    );
  }

  return <DataTable columns={columns} data={products} searchPlaceholder="Buscar producto..." />;
}
