'use client';

import { useState } from 'react';
import { Loader2, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePermission } from '@/hooks/usePermission';
import { useExternalHealth } from '../hooks/useExternalHealth';
import { ExternalHealthDialog } from './ExternalHealthDialog';

export function ExternalHealthButton() {
  const { can } = usePermission();
  const canRead = can('products.read');
  const [open, setOpen] = useState(false);
  const healthQuery = useExternalHealth();
  const issues = healthQuery.data?.data.counts.totalIssues ?? 0;
  const warnings = healthQuery.data?.data.warnings.length ?? 0;
  const hasProblems = issues > 0 || warnings > 0;

  if (!canRead) {
    return null;
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className={
          hasProblems
            ? 'gap-1.5 border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300'
            : 'gap-1.5 border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300'
        }
      >
        {healthQuery.isFetching ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : hasProblems ? (
          <ShieldAlert className="h-4 w-4" />
        ) : (
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
        )}
        Salud de mapeos
        {issues > 0 && (
          <span className="ml-0.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-semibold text-white">
            {issues}
          </span>
        )}
        {issues === 0 && warnings > 0 && (
          <span className="ml-0.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-amber-500 px-1.5 text-[11px] font-semibold text-white">
            !
          </span>
        )}
      </Button>
      <ExternalHealthDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
