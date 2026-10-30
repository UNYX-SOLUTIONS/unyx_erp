'use client';

import * as React from 'react';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
  type SortingState,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { DataTableEmptyState } from './DataTableEmptyState';
import { DataTableSkeleton } from './DataTableSkeleton';

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  onRowClick?: (row: TData) => void;
  selectedRowId?: string;
  getRowId?: (row: TData) => string;
  expandedRowId?: string | null;
  renderExpandedRows?: (row: TData) => React.ReactNode;
  isLoading?: boolean;
  skeletonRows?: number;
  emptyState?: React.ReactNode;
  pagination?: PaginationState;
  onPaginationChange?: OnChangeFn<PaginationState>;
  footer?: React.ReactNode;
  className?: string;
}

export function DataTable<TData>({
  columns,
  data,
  onRowClick,
  selectedRowId,
  getRowId,
  expandedRowId,
  renderExpandedRows,
  isLoading = false,
  skeletonRows = 8,
  emptyState,
  pagination,
  onPaginationChange,
  footer,
  className,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      ...(pagination ? { pagination } : {}),
    },
    onSortingChange: setSorting,
    onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    ...(pagination ? { getPaginationRowModel: getPaginationRowModel() } : {}),
    getRowId: getRowId ? (originalRow) => getRowId(originalRow) : undefined,
  });

  const rows = table.getRowModel().rows;

  return (
    <div className={cn('overflow-hidden rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900', className)}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/60 hover:bg-gray-50 dark:hover:bg-slate-800/50">
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  style={header.column.columnDef.size ? { width: header.column.columnDef.size } : undefined}
                  className="h-11 px-4 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <DataTableSkeleton columns={columns.length} rows={skeletonRows} />
          ) : rows.length > 0 ? (
            rows.map((row) => {
              const rowId = getRowId?.(row.original) ?? row.id;
              const isSelected = selectedRowId !== undefined && rowId === selectedRowId;
              const isExpanded = expandedRowId != null && rowId === expandedRowId;
              return (
                <React.Fragment key={row.id}>
                  <TableRow
                    onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                    data-expanded={renderExpandedRows ? String(isExpanded) : undefined}
                    aria-expanded={renderExpandedRows ? isExpanded : undefined}
                    className={cn(
                      'group border-gray-100 dark:border-slate-800 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/50',
                      onRowClick && 'cursor-pointer',
                      isExpanded && 'bg-gray-50/70 dark:bg-slate-800/40',
                      isSelected && 'border-l-2 border-l-blue-600 bg-blue-50/50 hover:bg-blue-50/50'
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                  {isExpanded && renderExpandedRows
                    ? renderExpandedRows(row.original)
                    : null}
                </React.Fragment>
              );
            })
          ) : (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length} className="p-0">
                {emptyState ?? <DataTableEmptyState />}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {footer}
    </div>
  );
}
