'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { NAV_SECTIONS } from '@/config/navigation';

interface Crumb {
  title: string;
  href?: string;
}

const SETTINGS_LABELS: Record<string, string> = {
  '/operations/settings/profile': 'Mi perfil',
  '/operations/settings/company': 'Empresa',
  '/operations/settings/users': 'Usuarios',
  '/operations/settings/roles': 'Roles',
  '/operations/settings/billing': 'Facturación',
};

function getCrumbs(pathname: string): Crumb[] {
  if (pathname === '/operations/dashboard') {
    return [{ title: 'Dashboard operativo' }];
  }
  const settingsLabel = SETTINGS_LABELS[pathname];
  if (settingsLabel) {
    return [{ title: 'Configuración', href: '/operations/settings/profile' }, { title: settingsLabel }];
  }
  let best: { title: string; href: string } | null = null;
  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
        if (!best || item.href.length > best.href.length) {
          best = { title: item.title, href: item.href };
        }
      }
    }
    for (const subcategory of section.subcategories ?? []) {
      for (const item of subcategory.items) {
        if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
          if (!best || item.href.length > best.href.length) {
            best = { title: item.title, href: item.href };
          }
        }
      }
    }
  }
  return best ? [best] : [];
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const crumbs = getCrumbs(pathname);

  return (
    <nav aria-label="Breadcrumb" className="hidden items-center gap-1.5 text-sm sm:flex">
      <Link href="/operations/dashboard" className="text-gray-400 dark:text-slate-500 transition-colors hover:text-gray-600 dark:hover:text-slate-300">
        Inicio
      </Link>
      {crumbs.map((crumb, index) => (
        <Fragment key={`${crumb.title}-${index}`}>
          <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
          {crumb.href && index < crumbs.length - 1 ? (
            <Link href={crumb.href} className="text-gray-400 dark:text-slate-500 transition-colors hover:text-gray-600 dark:hover:text-slate-300">
              {crumb.title}
            </Link>
          ) : (
            <span className="font-medium text-gray-900 dark:text-slate-100">{crumb.title}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
