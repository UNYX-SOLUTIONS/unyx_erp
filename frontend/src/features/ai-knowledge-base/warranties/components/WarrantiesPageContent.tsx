'use client';

import { useMemo, useState } from 'react';
import {
  ExternalLink,
  Loader2,
  MoreVertical,
  Plus,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { DataTableToolbar } from '@/components/data-table/DataTableToolbar';
import { FilterSelect } from '@/components/filters/FilterSelect';
import { SearchInput } from '@/components/filters/SearchInput';
import { useDebounce } from '@/hooks/useDebounce';
import { usePermission } from '@/hooks/usePermission';
import { formatLastUpdate } from '@/lib/formatters';
import { useDeleteWarranty, useUpdateWarranty, useWarranties } from '../hooks/useWarranties';
import { warrantyLabel } from '../lib/warranty-label';
import type { WarrantyDto } from '../types/warranty.types';
import { WarrantyFormDialog } from './WarrantyFormDialog';

const ALL = 'all';

const STATUS_OPTIONS = [
  { label: 'Todas', value: 'all' },
  { label: 'Activas', value: 'active' },
  { label: 'Inactivas', value: 'inactive' },
];

export function WarrantiesPageContent() {
  const { can } = usePermission();
  const canCreate = can('products.create');
  const canWrite = can('products.update');

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 250);
  const [status, setStatus] = useState(ALL);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<WarrantyDto | null>(null);
  const [deleting, setDeleting] = useState<WarrantyDto | null>(null);

  const warrantiesQuery = useWarranties('all');
  const updateWarranty = useUpdateWarranty();
  const deleteWarranty = useDeleteWarranty();

  const warranties = useMemo(
    () => warrantiesQuery.data?.data ?? [],
    [warrantiesQuery.data]
  );
  const activeCount = warranties.filter((warranty) => warranty.isActive).length;

  const filtered = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    return warranties.filter((warranty) => {
      if (status === 'active' && !warranty.isActive) {
        return false;
      }
      if (status === 'inactive' && warranty.isActive) {
        return false;
      }
      if (!term) {
        return true;
      }
      return [warranty.meses?.toString(), warranty.especial, warranty.observaciones]
        .filter(Boolean)
        .some((value) => (value as string).toLowerCase().includes(term));
    });
  }, [warranties, debouncedSearch, status]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (warranty: WarrantyDto) => {
    setEditing(warranty);
    setFormOpen(true);
  };

  const toggleActive = (warranty: WarrantyDto) => {
    updateWarranty.mutate({
      id: warranty.id,
      payload: { isActive: !warranty.isActive },
    });
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-slate-100">
            Garantías
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            Administra las garantías que se asignan a las variantes y alimentan al asistente
            comercial.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              {warranties.length} garantías
            </span>
            <span className="text-gray-300 dark:text-slate-700">|</span>
            <span>{activeCount} activas</span>
          </div>
          {canCreate && (
            <Button
              onClick={openCreate}
              className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Nueva garantía
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-gray-100 p-4 dark:border-slate-800">
          <DataTableToolbar>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Buscar por meses, garantía especial u observaciones"
              className="min-w-[300px] max-w-[420px] flex-1"
            />
            <FilterSelect
              label="Estado"
              options={STATUS_OPTIONS}
              value={status}
              onChange={setStatus}
              className="w-44"
            />
          </DataTableToolbar>
        </div>

        <div className="overflow-x-auto">
          {warrantiesQuery.isLoading ? (
            <div className="flex h-48 items-center justify-center gap-2 text-sm text-gray-500 dark:text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando garantías…
            </div>
          ) : warrantiesQuery.isError ? (
            <div className="flex h-48 flex-col items-center justify-center gap-3 text-sm text-gray-500 dark:text-slate-400">
              <p>No se pudieron cargar las garantías.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void warrantiesQuery.refetch()}
              >
                Reintentar
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-center text-sm text-gray-500 dark:text-slate-400">
              <ShieldCheck className="h-6 w-6 text-gray-300 dark:text-slate-600" />
              <p>
                {warranties.length === 0
                  ? 'Todavía no hay garantías registradas.'
                  : 'No hay garantías que coincidan con el filtro.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-100 dark:border-slate-800 hover:bg-transparent">
                  <TableHead className="px-4 text-xs uppercase tracking-wider text-gray-500">
                    Garantía
                  </TableHead>
                  <TableHead className="px-4 text-xs uppercase tracking-wider text-gray-500">
                    Observaciones
                  </TableHead>
                  <TableHead className="px-4 text-xs uppercase tracking-wider text-gray-500">
                    Fuente
                  </TableHead>
                  <TableHead className="px-4 text-xs uppercase tracking-wider text-gray-500">
                    Estado
                  </TableHead>
                  <TableHead className="px-4 text-xs uppercase tracking-wider text-gray-500">
                    Actualización
                  </TableHead>
                  {canWrite && (
                    <TableHead className="w-12 px-4 text-right text-xs uppercase tracking-wider text-gray-500">
                      Acciones
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((warranty) => (
                  <TableRow
                    key={warranty.id}
                    className="border-gray-100 dark:border-slate-800"
                  >
                    <TableCell className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                        {warranty.meses === null
                          ? 'Sin plazo en meses'
                          : `${warranty.meses} ${warranty.meses === 1 ? 'mes' : 'meses'}`}
                      </p>
                      <p className="mt-0.5 max-w-md truncate text-xs text-gray-500 dark:text-slate-400">
                        {warranty.especial?.trim() || 'Sin garantía especial'}
                      </p>
                    </TableCell>
                    <TableCell className="max-w-md px-4 py-3 text-sm text-gray-600 dark:text-slate-300">
                      <span className="line-clamp-2">
                        {warranty.observaciones?.trim() || '—'}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {warranty.fuenteUrl ? (
                        <a
                          href={warranty.fuenteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
                        >
                          Ver fuente
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-slate-500">—</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <StatusBadge
                        variant={warranty.isActive ? 'approved' : 'neutral'}
                        dot
                      >
                        {warranty.isActive ? 'Activa' : 'Inactiva'}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 dark:text-slate-400">
                      {formatLastUpdate(warranty.updatedAt)}
                    </TableCell>
                    {canWrite && (
                      <TableCell className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-500 dark:text-slate-400"
                              aria-label={`Acciones para ${warrantyLabel(warranty)}`}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(warranty)}>
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => toggleActive(warranty)}
                              disabled={updateWarranty.isPending}
                            >
                              {warranty.isActive ? 'Desactivar' : 'Activar'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleting(warranty)}
                              className="text-red-600 focus:text-red-600"
                            >
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <WarrantyFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        warranty={editing}
      />

      <Dialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar garantía</DialogTitle>
            <DialogDescription>
              ¿Seguro que quieres eliminar «{deleting ? warrantyLabel(deleting) : ''}»? Si
              está asignada a variantes, el sistema pedirá desactivarla en lugar de borrarla.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleting(null)}
              disabled={deleteWarranty.isPending}
              className="border-gray-300 text-gray-700 dark:border-slate-700 dark:text-slate-300"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deleteWarranty.isPending || !deleting}
              onClick={() => {
                if (!deleting) return;
                deleteWarranty.mutate(deleting.id, {
                  onSuccess: () => setDeleting(null),
                });
              }}
              className="gap-1.5 bg-red-600 text-white hover:bg-red-700"
            >
              {deleteWarranty.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
