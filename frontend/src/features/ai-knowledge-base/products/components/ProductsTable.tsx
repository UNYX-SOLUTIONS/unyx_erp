'use client';

import { useMemo, useState } from 'react';
import type { PaginationState } from '@tanstack/react-table';
import { Package } from 'lucide-react';
import { DataTable } from '@/components/data-table/DataTable';
import { DataTableEmptyState } from '@/components/data-table/DataTableEmptyState';
import { DataTablePagination } from '@/components/data-table/DataTablePagination';
import { PRODUCTS } from '../data/mock';
import { productColumns } from '../columns';
import { useProductDetailStore } from '../stores/product-detail-store';
import {
  ProductsFilters,
  type ProductLineFilter,
  type ProductSyncFilter,
  type ProductValidationFilter,
} from './ProductsFilters';

export function ProductsTable() {
  const [search, setSearch] = useState('');
  const [validation, setValidation] = useState<ProductValidationFilter>('all');
  const [sync, setSync] = useState<ProductSyncFilter>('all');
  const [line, setLine] = useState<ProductLineFilter>('all');
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const isDetailOpen = useProductDetailStore((state) => state.isOpen);
  const openedProductId = useProductDetailStore((state) => state.productId);
  const openProductDetail = useProductDetailStore((state) => state.open);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return PRODUCTS.filter((product) => {
      const matchesSearch =
        term.length === 0 ||
        product.name.toLowerCase().includes(term) ||
        product.sku.toLowerCase().includes(term) ||
        product.line.toLowerCase().includes(term);
      const matchesValidation = validation === 'all' || product.status === validation;
      const matchesSync = sync === 'all' || product.syncStatus === sync;
      const matchesLine = line === 'all' || product.line === line;
      return matchesSearch && matchesValidation && matchesSync && matchesLine;
    });
  }, [search, validation, sync, line]);

  const resetPage = () => setPagination((prev) => ({ ...prev, pageIndex: 0 }));

  const handleSearchChange = (value: string) => {
    setSearch(value);
    resetPage();
  };

  const handleValidationChange = (value: ProductValidationFilter) => {
    setValidation(value);
    resetPage();
  };

  const handleSyncChange = (value: ProductSyncFilter) => {
    setSync(value);
    resetPage();
  };

  const handleLineChange = (value: ProductLineFilter) => {
    setLine(value);
    resetPage();
  };

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

      <DataTable
        columns={productColumns}
        data={filteredProducts}
        pagination={pagination}
        onPaginationChange={setPagination}
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
            page={pagination.pageIndex + 1}
            pageSize={pagination.pageSize}
            total={filteredProducts.length}
            onPageChange={(page) => setPagination((prev) => ({ ...prev, pageIndex: page - 1 }))}
            onPageSizeChange={(pageSize) => setPagination({ pageIndex: 0, pageSize })}
            itemLabel="productos"
          />
        }
      />
    </div>
  );
}
