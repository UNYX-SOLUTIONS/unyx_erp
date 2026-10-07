// frontend/src/features/orders/pages/OrdersListPage.tsx

'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OrderStatusTabs } from '@/features/orders/components/OrderStatusTabs';
import { OrdersFilters } from '@/features/orders/components/OrdersFilter';
import { OrdersTable } from '@/features/orders/components/OrdersTable';
import { MOCK_ORDERS } from '@/features/orders/data/mock';
import {
  ORDER_STATUS_META,
  type OrderTabFilter,
  type Order,
} from '@/features/orders/types/order.types';

export function OrdersListPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<OrderTabFilter>('ALL');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('30d');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const filtered = useMemo(() => {
    return MOCK_ORDERS.filter((o) => {
      if (activeTab !== 'ALL' && ORDER_STATUS_META[o.status].tab !== activeTab) return false;
      if (statusFilter !== 'ALL' && ORDER_STATUS_META[o.status].tab !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchesId = o.id.toLowerCase().includes(q);
        const matchesCustomer = o.customer.name.toLowerCase().includes(q);
        if (!matchesId && !matchesCustomer) return false;
      }
      return true;
    });
  }, [activeTab, search, statusFilter]);

  const counts: Record<OrderTabFilter, number> = useMemo(
    () => ({
      ALL: MOCK_ORDERS.length,
      DRAFT: MOCK_ORDERS.filter((o) => ORDER_STATUS_META[o.status].tab === 'DRAFT').length,
      RESERVED: MOCK_ORDERS.filter((o) => ORDER_STATUS_META[o.status].tab === 'RESERVED').length,
      IN_PROGRESS: MOCK_ORDERS.filter((o) => ORDER_STATUS_META[o.status].tab === 'IN_PROGRESS')
        .length,
      DELIVERED: MOCK_ORDERS.filter((o) => ORDER_STATUS_META[o.status].tab === 'DELIVERED').length,
      WITH_ISSUE: MOCK_ORDERS.filter((o) => ORDER_STATUS_META[o.status].tab === 'WITH_ISSUE')
        .length,
    }),
    [],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleView = (order: Order) => {
    if (order.status === 'DRAFT') {
      router.push('/operations/orders/new');
      return;
    }
    router.push(`/operations/orders/${order.id.replace('#', '')}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-slate-100">
            Mis pedidos
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            Crea, consulta y da seguimiento en tiempo real a tus pedidos comerciales.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            Sincronizado con Kommo
          </div>
          <Button
            onClick={() => router.push('/operations/orders/new')}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Nuevo pedido
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <OrderStatusTabs
        active={activeTab}
        counts={counts}
        onChange={(tab) => {
          setActiveTab(tab);
          setPage(1);
        }}
      />

      {/* Filtros */}
      <OrdersFilters
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        dateFilter={dateFilter}
        onDateChange={setDateFilter}
      />

      {/* Tabla */}
      <OrdersTable orders={paginated} onView={handleView} onAction={handleView} />

      {/* Paginación */}
      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
        <span className="text-sm text-gray-500">
          Mostrando {paginated.length === 0 ? 0 : (page - 1) * pageSize + 1}-
          {Math.min(page * pageSize, filtered.length)} de {filtered.length} pedidos
        </span>
        <div className="flex items-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="rounded-md border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-50"
          >
            ← Anterior
          </button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`h-8 w-8 rounded-md text-sm ${
                page === i + 1
                  ? 'bg-blue-600 text-white'
                  : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="rounded-md border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Siguiente →
          </button>
        </div>
      </div>
    </div>
  );
}
