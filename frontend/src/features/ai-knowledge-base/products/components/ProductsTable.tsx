'use client';

import { useMemo, useState } from 'react';
import type { PaginationState } from '@tanstack/react-table';
import { Package, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table/DataTable';
import { DataTableEmptyState } from '@/components/data-table/DataTableEmptyState';
import { DataTablePagination } from '@/components/data-table/DataTablePagination';
import { useDebounce } from '@/hooks/useDebounce';
import { productColumns } from '../columns';
import { useProducts } from '../hooks/useProducts';
import { mapProductDtoToUi } from '../mappers';
import { useProductDetailStore } from '../stores/product-detail-store';
import type { ProductListParams } from '../types/product.types';
import { ProductsFilters } from './ProductsFilters';

const ALL = 'all';

export function ProductsTable() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [validation, setValidation] = useState(ALL);
  const [sync, setSync] = useState(ALL);
  const [line, setLine] = useState(ALL);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  const isDetailOpen = useProductDetailStore((state) => state.isOpen);
  const openedProductId = useProductDetailStore((state) => state.productId);
  const openProductDetail = useProductDetailStore((state) => state.open);

  const params = useMemo<ProductListParams>(
    () => ({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(validation !== ALL ? { validation: validation as ProductListParams['validation'] } : {}),
      ...(sync !== ALL ? { syncStatus: sync as ProductListParams['syncStatus'] } : {}),
      ...(line !== ALL ? { line } : {}),
    }),
    [pagination, debouncedSearch, validation, sync, line]
  );

  const { data, isLoading, isError, isFetching, refetch } = useProducts(params);

  const products = useMemo(() => (data?.data ?? []).map(mapProductDtoToUi), [data]);
  const meta = data?.meta;

  const resetPage = () => setPagination((prev) => ({ ...prev, pageIndex: 0 }));

  const handleSearchChange = (value: string) => {
    setSearch(value);
    resetPage();
  };

  const handleValidationChange = (value: string) => {
    setValidation(value);
    resetPage();
  };

  const handleSyncChange = (value: string) => {
    setSync(value);
    resetPage();
  };

  const handleLineChange = (value: string) => {
    setLine(value);
    resetPage();
  };

  if (isError) {
    return (
      <div className="space-y-4">
        <ProductsFilters
          search={search}
          onSearchChange={handleSearchChange}
          validation={validation}
          onValidationChange={handleValidationChange}
          sync={sync}
          onSyncChange={handleSyncChange}
          line={line}
          onLineChange={handleLineChange}
        />
        <div className="rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <DataTableEmptyState
            icon={RefreshCw}
            title="No se pudieron cargar los productos"
            description="Verifica que el backend esté disponible e intenta nuevamente."
            action={
              <Button
                variant="outline"
                onClick={() => void refetch()}
                className="border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300"
              >
                Reintentar
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ProductsFilters
        search={search}
        onSearchChange={handleSearchChange}
        validation={validation}
        onValidationChange={handleValidationChange}
        sync={sync}
        onSyncChange={handleSyncChange}
        line={line}
        onLineChange={handleLineChange}
      />

      <div>
        <DataTable
          columns={productColumns}
          data={products}
          isLoading={isLoading}
          skeletonRows={8}
          onRowClick={(product) => openProductDetail(product.id)}
          selectedRowId={isDetailOpen ? (openedProductId ?? undefined) : undefined}
          getRowId={(product) => product.id}
          emptyState={
            <DataTableEmptyState
              icon={Package}
              title="No se encontraron productos"
              description="Ajusta los filtros o la búsqueda para ver resultados."
            />
          }
          footer={
            <DataTablePagination
              page={meta?.page ?? pagination.pageIndex + 1}
              pageSize={pagination.pageSize}
              total={meta?.total ?? 0}
              onPageChange={(page) => setPagination((prev) => ({ ...prev, pageIndex: page - 1 }))}
              onPageSizeChange={(pageSize) => setPagination({ pageIndex: 0, pageSize })}
              itemLabel="productos"
            />
          }
        />
        {isFetching && !isLoading && (
          <p className="mt-2 text-right text-xs text-gray-400 dark:text-slate-500">Actualizando…</p>
        )}
      </div>
    </div>
  );
}
