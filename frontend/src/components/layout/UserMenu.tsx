'use client';

import Link from 'next/link';
import { ChevronDown, ChevronsUpDown, Loader2, LogOut, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { initials } from '@/lib/formatters';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface UserMenuProps {
  variant?: 'topbar' | 'sidebar';
  collapsed?: boolean;
}

export function UserMenu({ variant = 'topbar', collapsed = false }: UserMenuProps) {
  const { user } = useCurrentUser();
  const logout = useLogout();

  if (!user) {
    return null;
  }

  const isSidebar = variant === 'sidebar';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
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
        side={isSidebar ? 'top' : 'bottom'}
        align={isSidebar ? 'start' : 'end'}
        className="w-56"
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/operations/settings/profile">
            <User className="mr-2 h-4 w-4" />
            Mi perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className="text-destructive focus:text-destructive"
        >
          {logout.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="mr-2 h-4 w-4" />
          )}
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
