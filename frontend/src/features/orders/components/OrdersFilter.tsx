// frontend/src/features/orders/components/OrdersFilters.tsx

'use client';

import { Search, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ORDER_TABS } from '../types/order.types';

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  dateFilter: string;
  onDateChange: (value: string) => void;
}

export function OrdersFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  dateFilter,
  onDateChange,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[300px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por pedido (#PED-1050) o nombre de cliente..."
          className="pl-9"
        />
      </div>

      <div className="relative">
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="appearance-none rounded-md border border-gray-200 bg-white px-3 py-2 pr-9 text-sm text-gray-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
        >
          <option value="ALL">Estado: Todos</option>
          {ORDER_TABS.filter((t) => t.id !== 'ALL').map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
      </div>

      <div className="relative">
        <select
          value={dateFilter}
          onChange={(e) => onDateChange(e.target.value)}
          className="appearance-none rounded-md border border-gray-200 bg-white px-3 py-2 pr-9 text-sm text-gray-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
        >
          <option value="30d">Fecha: Últimos 30 días</option>
          <option value="7d">Últimos 7 días</option>
          <option value="today">Hoy</option>
          <option value="all">Todo el histórico</option>
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
      </div>
    </div>
  );
}
