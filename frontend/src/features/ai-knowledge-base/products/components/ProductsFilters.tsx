'use client';

import { DataTableToolbar } from '@/components/data-table/DataTableToolbar';
import { FilterSelect } from '@/components/filters/FilterSelect';
import { SearchInput } from '@/components/filters/SearchInput';
import { cn } from '@/lib/utils';
import { useCategories } from '../hooks/useCategories';

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

const ACTIVE_OPTIONS = [
  { label: 'Activos', value: 'active' },
  { label: 'Inactivos', value: 'inactive' },
  { label: 'Anulados', value: 'annulled' },
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
  active: string;
  onActiveChange: (value: string) => void;
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
  active,
  onActiveChange,
}: ProductsFiltersProps) {
  const { data: categories } = useCategories();
  const categoryOptions = [
    { label: 'Todas las categorías', value: 'all' },
    ...(categories ?? []).map((category) => ({
      label: category.nombre,
      value: category.nombre,
    })),
  ];

  return (
    <DataTableToolbar>
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder="Buscar por SKU, nombre, categoría o subcategoría"
        className="min-w-[300px] max-w-[400px] flex-1"
      />
      <div className="flex items-center gap-2">
        <span className="whitespace-nowrap text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400">
          Actividad:
        </span>
        <div className="inline-flex h-10 items-center rounded-md border border-gray-200 bg-gray-50 p-0.5 dark:border-slate-800 dark:bg-slate-900">
          {ACTIVE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onActiveChange(option.value)}
              aria-pressed={active === option.value}
              className={cn(
                'h-9 rounded px-3 text-xs font-medium transition-colors',
                active === option.value
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-slate-800 dark:text-slate-100'
                  : 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
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
        label="Categoría"
        options={categoryOptions}
        value={line}
        onChange={onLineChange}
        className="w-52"
      />
    </DataTableToolbar>
  );
}
