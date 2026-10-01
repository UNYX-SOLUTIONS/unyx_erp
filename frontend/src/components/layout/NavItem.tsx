'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { NavItem as NavItemData } from '@/config/navigation';

interface NavItemProps {
  item: NavItemData;
  isActive: boolean;
  indented?: boolean;
  collapsed?: boolean;
}

export function NavItem({ item, isActive, indented = false, collapsed = false }: NavItemProps) {
  return (
    <Link
      href={item.href}
      aria-current={isActive ? 'page' : undefined}
      title={collapsed ? item.title : undefined}
      className={cn(
        'flex items-center gap-2.5 rounded-lg border-l-2 border-transparent px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white',
        indented && !collapsed && 'pl-9',
        collapsed && 'justify-center px-0',
        isActive && 'border-l-blue-500 bg-blue-500/15 font-semibold text-white hover:bg-blue-500/15'
      )}
    >
      <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      {!collapsed && <span className="truncate">{item.title}</span>}
    </Link>
  );
}
