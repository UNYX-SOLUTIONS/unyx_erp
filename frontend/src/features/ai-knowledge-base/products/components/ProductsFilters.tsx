'use client';

import { DataTableToolbar } from '@/components/data-table/DataTableToolbar';
import { FilterSelect } from '@/components/filters/FilterSelect';
import { SearchInput } from '@/components/filters/SearchInput';
import type { ProductLine, ProductStatus, ProductSyncStatus } from '../types/product.types';

export type ProductValidationFilter = ProductStatus | 'all';
export type ProductSyncFilter = ProductSyncStatus | 'all';
export type ProductLineFilter = ProductLine | 'all';

const VALIDATION_OPTIONS = [
  { label: 'Todos los estados', value: 'all' },
  { label: 'Aprobado', value: 'approved' },
  { label: 'Pendiente', value: 'pending' },
  { label: 'Requiere corrección', value: 'needsCorrection' },
  { label: 'Sin precio', value: 'noPrice' },
];

const SYNC_OPTIONS = [
  { label: 'Todos', value: 'all' },
  { label: 'Sincronizado', value: 'synced' },
  { label: 'Sin sincronizar', value: 'notSynced' },
];

const LINE_OPTIONS = [
  { label: 'Todas las líneas', value: 'all' },
  { label: 'Sillines', value: 'Sillines' },
  { label: 'Mesas Auxiliares', value: 'Mesas Auxiliares' },
  { label: 'Sillas de Espera', value: 'Sillas de Espera' },
  { label: 'Sillas Ejecutivas', value: 'Sillas Ejecutivas' },
  { label: 'Sillas Operativas', value: 'Sillas Operativas' },
  { label: 'Sillas Lounge', value: 'Sillas Lounge' },
];

interface ProductsFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  validation: ProductValidationFilter;
  onValidationChange: (value: ProductValidationFilter) => void;
  sync: ProductSyncFilter;
  onSyncChange: (value: ProductSyncFilter) => void;
  line: ProductLineFilter;
  onLineChange: (value: ProductLineFilter) => void;
}

export function ProductsFilters({
  search,
  onSearchChange,
  validation,
  onValidationChange,
  sync,
  onSyncChange,
  line,
  onLineChange,
}: ProductsFiltersProps) {
  return (
    <DataTableToolbar>
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder="Buscar por SKU, nombre, categoría o línea"
        className="min-w-[300px] max-w-[400px] flex-1"
      />
      <FilterSelect
        label="Validación"
        options={VALIDATION_OPTIONS}
        value={validation}
        onChange={(value) => onValidationChange(value as ProductValidationFilter)}
        className="w-48"
      />
      <FilterSelect
        label="Sincronización"
        options={SYNC_OPTIONS}
        value={sync}
        onChange={(value) => onSyncChange(value as ProductSyncFilter)}
        className="w-40"
      />
      <FilterSelect
        label="Línea"
        options={LINE_OPTIONS}
        value={line}
        onChange={(value) => onLineChange(value as ProductLineFilter)}
        className="w-48"
      />
    </DataTableToolbar>
  );
}
