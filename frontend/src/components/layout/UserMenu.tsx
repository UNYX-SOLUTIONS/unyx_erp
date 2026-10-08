'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeftRight,
  ChevronDown,
  ChevronsUpDown,
  Copy,
  CreditCard,
  Loader2,
  LogOut,
  Palette,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ACTIVE_COMPANY } from '@/config/companies';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { initials } from '@/lib/formatters';
import { ThemeOptions } from './ThemeOptions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface UserMenuProps {
  variant?: 'topbar' | 'sidebar';
  collapsed?: boolean;
}

export function UserMenu({ variant = 'topbar', collapsed = false }: UserMenuProps) {
  const { user } = useCurrentUser();
  const logout = useLogout();
  const [open, setOpen] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  if (!user) {
    return null;
  }

  const isSidebar = variant === 'sidebar';

  const cancelClose = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const openMenu = () => {
    cancelClose();
    setOpen(true);
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimeoutRef.current = setTimeout(() => setOpen(false), 120);
  };

  const copyToClipboard = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copiado`);
    } catch {
      toast.error('No se pudo copiar');
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onMouseEnter={openMenu}
          onMouseLeave={scheduleClose}
          className={cn(
            'flex items-center gap-2.5 transition-colors focus:outline-none',
            isSidebar
              ? 'w-full rounded-lg px-2 py-2 hover:bg-white/5'
              : 'rounded-md px-1.5 py-1 hover:bg-gray-50 dark:hover:bg-slate-800/50',
            collapsed && 'justify-center px-0'
          )}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
            {initials(user.firstName, user.lastName)}
          </span>
          {!collapsed && (
            <span
              className={cn(
                'min-w-0 flex-1 flex-col items-start leading-tight',
                isSidebar ? 'flex' : 'hidden lg:flex'
              )}
            >
              <span
                className={cn(
                  'truncate text-sm font-medium',
                  isSidebar ? 'text-slate-100' : 'text-gray-900 dark:text-slate-100'
                )}
              >
                {user.firstName} {user.lastName}
              </span>
              <span
                className={cn(
                  'truncate text-[11px]',
                  isSidebar ? 'text-slate-400' : 'text-gray-400 dark:text-slate-500'
                )}
              >
                {user.isSuperAdmin ? 'Administrador' : 'Usuario'}
              </span>
            </span>
          )}
          {!collapsed &&
            (isSidebar ? (
              <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden="true" />
            ) : (
              <ChevronDown
                className="hidden h-3.5 w-3.5 text-gray-400 dark:text-slate-500 lg:block"
                aria-hidden="true"
              />
            ))}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={isSidebar ? 'right' : 'bottom'}
        align="end"
        sideOffset={isSidebar ? 8 : 4}
        className="w-64"
        onMouseEnter={openMenu}
        onMouseLeave={scheduleClose}
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.firstName} {user.lastName}
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="truncate" title={user.id}>
                ID de usuario: {user.id}
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(user.id, 'ID de usuario')}
                title="Copiar ID"
                className="rounded p-0.5 transition-colors hover:bg-muted hover:text-foreground"
              >
                <Copy className="h-3 w-3" />
              </button>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/operations/settings/profile">
            <Settings className="mr-2 h-4 w-4" />
            Configuración del perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Palette className="mr-2 h-4 w-4" />
            Tema
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent
            className="w-40"
            onMouseEnter={openMenu}
            onMouseLeave={scheduleClose}
          >
            <ThemeOptions />
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className="text-destructive focus:text-destructive dark:text-red-300"
        >
          {logout.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="mr-2 h-4 w-4" />
          )}
          Cerrar sesión
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{ACTIVE_COMPANY.name}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="truncate" title={ACTIVE_COMPANY.id}>
                ID de espacio de trabajo: {ACTIVE_COMPANY.id}
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(ACTIVE_COMPANY.id, 'ID de espacio de trabajo')}
                title="Copiar ID"
                className="rounded p-0.5 transition-colors hover:bg-muted hover:text-foreground"
              >
                <Copy className="h-3 w-3" />
              </button>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuItem disabled>
          <ArrowLeftRight className="mr-2 h-4 w-4" />
          Cambiar espacio de trabajo
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/operations/settings/company">
            <Settings className="mr-2 h-4 w-4" />
            Configuración del espacio
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/operations/settings/billing">
            <CreditCard className="mr-2 h-4 w-4" />
            Facturación
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
