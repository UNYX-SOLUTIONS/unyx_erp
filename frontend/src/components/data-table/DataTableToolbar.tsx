'use client';

import { Search } from 'lucide-react';
import type { Table } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchPlaceholder?: string;
}

export function DataTableToolbar<TData>({
  table,
  searchPlaceholder = 'Buscar...',
}: DataTableToolbarProps<TData>) {
  const firstSearchable = table
    .getAllColumns()
    .find((column) => column.getCanGlobalFilter?.() ?? false);

  return (
    <div className="flex items-center justify-between">
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
          onChange={(event) => table.getColumn('name')?.setFilterValue(event.target.value)}
          className="pl-8"
          disabled={!firstSearchable}
        />
      </div>
    </div>
  );
}
