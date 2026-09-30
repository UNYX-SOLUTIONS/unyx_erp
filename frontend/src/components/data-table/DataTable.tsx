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
    <div className={cn('overflow-hidden rounded-lg border border-gray-200 bg-white', className)}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="border-gray-200 bg-gray-50 hover:bg-gray-50">
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  style={header.column.columnDef.size ? { width: header.column.columnDef.size } : undefined}
                  className="h-11 px-4 text-xs font-medium uppercase tracking-wide text-gray-500"
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
              const isSelected =
                selectedRowId !== undefined && getRowId?.(row.original) === selectedRowId;
              return (
                <TableRow
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  className={cn(
                    'border-gray-100 transition-colors hover:bg-gray-50',
                    onRowClick && 'cursor-pointer',
                    isSelected && 'border-l-2 border-l-blue-600 bg-blue-50/50 hover:bg-blue-50/50'
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
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
