'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NavSection as NavSectionData } from '@/config/navigation';
import { usePermission } from '@/hooks/usePermission';
import { NavItem } from './NavItem';

interface NavSectionProps {
  section: NavSectionData;
  pathname: string;
}

function isItemActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') {
    return pathname === '/dashboard';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavSection({ section, pathname }: NavSectionProps) {
  const [open, setOpen] = useState(true);
  const { can } = usePermission();

  const items = section.items.filter((item) => !item.permission || can(item.permission));

  if (items.length === 0) {
    return null;
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between px-3 pb-1.5 pt-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400 transition-colors hover:text-gray-600"
      >
        {section.title}
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', !open && '-rotate-90')} />
      </button>
      {open && (
        <div className="space-y-0.5">
          {items.map((item) => (
            <NavItem key={item.href} item={item} isActive={isItemActive(pathname, item.href)} />
          ))}
        </div>
      )}
    </div>
  );
}
