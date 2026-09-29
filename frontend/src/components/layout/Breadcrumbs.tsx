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
  '/dashboard/settings/profile': 'Mi perfil',
  '/dashboard/settings/company': 'Empresa',
  '/dashboard/settings/users': 'Usuarios',
  '/dashboard/settings/roles': 'Roles',
  '/dashboard/settings/billing': 'Facturación',
};

function getCrumbs(pathname: string): Crumb[] {
  if (pathname === '/dashboard') {
    return [{ title: 'Dashboard operativo' }];
  }
  const settingsLabel = SETTINGS_LABELS[pathname];
  if (settingsLabel) {
    return [{ title: 'Configuración', href: '/dashboard/settings/profile' }, { title: settingsLabel }];
  }
  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
        return [{ title: item.title, href: item.href }];
      }
    }
  }
  return [];
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const crumbs = getCrumbs(pathname);

  return (
    <nav aria-label="Breadcrumb" className="hidden items-center gap-1.5 text-sm sm:flex">
      <Link href="/dashboard" className="text-gray-400 transition-colors hover:text-gray-600">
        Inicio
      </Link>
      {crumbs.map((crumb, index) => (
        <Fragment key={`${crumb.title}-${index}`}>
          <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
          {crumb.href && index < crumbs.length - 1 ? (
            <Link href={crumb.href} className="text-gray-400 transition-colors hover:text-gray-600">
              {crumb.title}
            </Link>
          ) : (
            <span className="font-medium text-gray-900">{crumb.title}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
