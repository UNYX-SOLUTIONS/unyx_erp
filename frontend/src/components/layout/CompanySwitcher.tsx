'use client';

import { Building2, ChevronsUpDown } from 'lucide-react';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function CompanySwitcher() {
  const { company } = useCurrentUser();

  return (
    <div className="border-b border-white/10 p-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-white/5"
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-500/15 text-blue-300">
                <Building2 className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="flex min-w-0 flex-col items-start">
                <span className="w-full truncate text-sm font-semibold uppercase text-slate-100">
                  {company?.name ?? 'Empresa'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Esquema de trabajo</span>
              </span>
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-60">
          <DropdownMenuLabel>Empresa activa</DropdownMenuLabel>
          <DropdownMenuItem disabled>
            <Building2 className="mr-2 h-4 w-4" />
            {company?.name ?? 'Sin empresa'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
