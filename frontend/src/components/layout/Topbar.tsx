'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Bell, Calendar, ChevronDown, MapPin, Menu, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/ui-store';
import { TOPBAR_PAGE_CONFIG } from '@/config/topbar';
import { BadgeDot } from '@/components/ui/badge-dot';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Breadcrumbs } from './Breadcrumbs';
import { UserMenu } from './UserMenu';

const CURRENT_LOCATION = 'Sede Central - Bodega 1';

export function Topbar() {
  const pathname = usePathname();
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const [isSyncing, setIsSyncing] = useState(false);
  const today = format(new Date(), 'dd MMM', { locale: es });
  const pageConfig = TOPBAR_PAGE_CONFIG[pathname];

  const handleSync = () => {
    if (isSyncing) {
      return;
    }
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      toast.success('Conocimiento sincronizado');
    }, 1200);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-gray-200 bg-white px-4">
      <Button variant="ghost" size="icon" onClick={toggleSidebar} className="lg:hidden">
        <Menu className="h-5 w-5" />
      </Button>

      {pageConfig ? (
        <div className="hidden min-w-0 flex-col justify-center sm:flex">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
            {(pageConfig.breadcrumb ?? []).map((segment, index, segments) => (
              <Fragment key={`${segment.label}-${index}`}>
                {index > 0 && <span className="text-gray-300">·</span>}
                {segment.href ? (
                  <Link
                    href={segment.href}
                    className="text-gray-400 transition-colors hover:text-gray-600"
                  >
                    {segment.label}
                  </Link>
                ) : (
                  <span
                    className={
                      index === segments.length - 1
                        ? 'font-medium text-gray-900'
                        : 'text-gray-400'
                    }
                  >
                    {segment.label}
                  </span>
                )}
              </Fragment>
            ))}
            {pageConfig.badge && (
              <BadgeDot
                label={pageConfig.badge}
                tone={pageConfig.badgeTone ?? 'green'}
                className="ml-1"
              />
            )}
          </nav>
          {pageConfig.subtitle && (
            <span className="text-xs text-gray-500">{pageConfig.subtitle}</span>
          )}
        </div>
      ) : (
        <Breadcrumbs />
      )}

      <div className="ml-auto flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="hidden gap-2 border-gray-200 text-gray-700 md:flex"
            >
              <Calendar className="h-4 w-4 text-gray-400" />
              Hoy ({today})
              <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Hoy</DropdownMenuItem>
            <DropdownMenuItem>Ayer</DropdownMenuItem>
            <DropdownMenuItem>Últimos 7 días</DropdownMenuItem>
            <DropdownMenuItem>Este mes</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="hidden gap-2 border-gray-200 text-gray-700 lg:flex"
            >
              <MapPin className="h-4 w-4 text-gray-400" />
              {CURRENT_LOCATION}
              <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>{CURRENT_LOCATION}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {pageConfig?.action === 'sync-knowledge' ? (
          <div className="flex flex-col items-end gap-0.5">
            <Button
              size="sm"
              onClick={handleSync}
              disabled={isSyncing}
              className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700"
            >
              <RefreshCw className={cn('h-4 w-4', isSyncing && 'animate-spin')} />
              <span className="hidden sm:inline">Sincronizar conocimiento</span>
            </Button>
            {pageConfig.actionMeta && (
              <span className="hidden text-xs text-gray-500 lg:block">{pageConfig.actionMeta}</span>
            )}
          </div>
        ) : (
          <Button size="sm" className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Acción rápida</span>
          </Button>
        )}

        <Button variant="ghost" size="icon" className="relative text-gray-500">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            2
          </span>
          <span className="sr-only">Notificaciones</span>
        </Button>

        <UserMenu />
      </div>
    </header>
  );
}
