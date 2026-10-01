'use client';

import Link from 'next/link';
import { ChevronDown, Loader2, LogOut, User } from 'lucide-react';
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

export function UserMenu() {
  const { user } = useCurrentUser();
  const logout = useLogout();

  if (!user) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2.5 rounded-md px-1.5 py-1 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/50 focus:outline-none"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
            {initials(user.firstName, user.lastName)}
          </span>
          <span className="hidden flex-col items-start leading-tight lg:flex">
            <span className="text-sm font-medium text-gray-900 dark:text-slate-100">
              {user.firstName} {user.lastName}
            </span>
            <span className="text-[11px] text-gray-400 dark:text-slate-500">
              {user.isSuperAdmin ? 'Administrador' : 'Usuario'}
            </span>
          </span>
          <ChevronDown className="hidden h-3.5 w-3.5 text-gray-400 dark:text-slate-500 lg:block" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
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
