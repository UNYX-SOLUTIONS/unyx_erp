'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { NavItem as NavItemData } from '@/config/navigation';

interface NavItemProps {
  item: NavItemData;
  isActive: boolean;
  indented?: boolean;
}

export function NavItem({ item, isActive, indented = false }: NavItemProps) {
  return (
    <Link
      href={item.href}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900',
        indented && 'pl-9',
        isActive && 'bg-blue-50 text-blue-700 hover:bg-blue-50 hover:text-blue-700'
      )}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{item.title}</span>
    </Link>
  );
}
