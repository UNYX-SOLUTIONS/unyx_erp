'use client';

import { useMemo, useState } from 'react';
import type { ColumnDef, PaginationState } from '@tanstack/react-table';
import { AlertCircle, Inbox } from 'lucide-react';
import { DataTable } from '@/components/data-table/DataTable';
import { DataTableColumnHeader } from '@/components/data-table/DataTableColumnHeader';
import { DataTableEmptyState } from '@/components/data-table/DataTableEmptyState';
import { DataTablePagination } from '@/components/data-table/DataTablePagination';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useProducts } from '../hooks/useProducts';
import type { Product } from '../types/product-types';

export function ProductTable() {
  const { data, isLoading, isError } = useProducts();
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

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

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-md border border-dashed p-8 text-center">
        <AlertCircle className="h-8 w-8 text-muted-foreground" />
        <p className="text-muted-foreground">No se pudieron cargar los productos.</p>
      </div>
    );
  }

  const products = data?.data ?? [];

  return (
    <DataTable
      columns={columns}
      data={products}
      isLoading={isLoading}
      pagination={pagination}
      onPaginationChange={setPagination}
      emptyState={
        <DataTableEmptyState
          icon={Inbox}
          title="Aún no hay productos registrados"
          description="Crea tu primer producto para verlo aquí."
        />
      }
      footer={
        <DataTablePagination
          page={pagination.pageIndex + 1}
          pageSize={pagination.pageSize}
          total={products.length}
          onPageChange={(page) => setPagination((prev) => ({ ...prev, pageIndex: page - 1 }))}
          onPageSizeChange={(pageSize) => setPagination({ pageIndex: 0, pageSize })}
          itemLabel="productos"
        />
      }
    />
  );
}
