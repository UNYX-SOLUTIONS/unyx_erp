'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePermission } from '@/hooks/usePermission';
import { getExternalPending } from '../api/products.api';
import { ExternalSyncDialog } from './ExternalSyncDialog';

export function ExternalSyncButton() {
  const { can } = usePermission();
  const canImport = can('products.create');
  const [open, setOpen] = useState(false);
  const pendingQuery = useQuery({
    queryKey: ['external-pending'],
    queryFn: () => getExternalPending({ limit: 1000 }),
    staleTime: 120_000,
    refetchOnWindowFocus: false,
    enabled: canImport,
  });

  const total = pendingQuery.data?.data.counts.total ?? 0;

  if (!canImport) {
    return null;
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="gap-1.5 border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <RefreshCw
          className={
            pendingQuery.isFetching ? 'h-4 w-4 animate-spin' : 'h-4 w-4'
          }
        />
        Sincronizar externos
        {total > 0 && (
          <span className="ml-0.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-amber-500 px-1.5 text-[11px] font-semibold text-white">
            {total}
          </span>
        )}
      </Button>
      <ExternalSyncDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
