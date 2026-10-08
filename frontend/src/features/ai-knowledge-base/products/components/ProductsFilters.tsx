'use client';

import { DataTableToolbar } from '@/components/data-table/DataTableToolbar';
import { FilterSelect } from '@/components/filters/FilterSelect';
import { SearchInput } from '@/components/filters/SearchInput';

export const PRODUCT_LINES = [
  'Sillas Tapizadas',
  'Sillas de Plastico',
  'Bases y mesas',
  'Taburetes',
  'Sillas de Oficina',
  'Sillines',
  'Mesas Auxiliares',
  'Sillas de Espera',
  'Sillas Ejecutivas',
  'Sillas Operativas',
  'Sillas Lounge',
];

const VALIDATION_OPTIONS = [
  { label: 'Todos los estados', value: 'all' },
  { label: 'Aprobado', value: 'APROBADO' },
  { label: 'Pendiente', value: 'PENDIENTE' },
  { label: 'Requiere corrección', value: 'REQUIERE_CORRECCION' },
];

const SYNC_OPTIONS = [
  { label: 'Todos', value: 'all' },
  { label: 'Sincronizado', value: 'SINCRONIZADO' },
  { label: 'Sin sincronizar', value: 'SIN_SINCRONIZAR' },
];

const LINE_OPTIONS = [
  { label: 'Todas las líneas', value: 'all' },
  ...PRODUCT_LINES.map((line) => ({ label: line, value: line })),
];

interface ProductsFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  validation: string;
  onValidationChange: (value: string) => void;
  sync: string;
  onSyncChange: (value: string) => void;
  line: string;
  onLineChange: (value: string) => void;
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
        onChange={onValidationChange}
        className="w-48"
      />
      <FilterSelect
        label="Sincronización"
        options={SYNC_OPTIONS}
        value={sync}
        onChange={onSyncChange}
        className="w-44"
      />
      <FilterSelect
        label="Línea"
        options={LINE_OPTIONS}
        value={line}
        onChange={onLineChange}
        className="w-52"
      />
    </DataTableToolbar>
  );
}
