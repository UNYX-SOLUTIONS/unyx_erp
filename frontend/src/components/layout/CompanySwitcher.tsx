'use client';

import { Building2, ChevronsUpDown } from 'lucide-react';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { Button } from '@/components/ui/button';
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
    <div className="border-b border-gray-200 p-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-auto w-full justify-between gap-2 px-2 py-2 hover:bg-gray-50"
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                <Building2 className="h-4 w-4" />
              </span>
              <span className="flex min-w-0 flex-col items-start">
                <span className="w-full truncate text-sm font-semibold uppercase text-gray-900">
                  {company?.name ?? 'Empresa'}
                </span>
                <span className="text-[11px] text-gray-400">Esquema de trabajo</span>
              </span>
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-gray-400" />
          </Button>
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
