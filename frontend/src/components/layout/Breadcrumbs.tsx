'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { NAVIGATION } from '@/config/navigation';

interface Crumb {
  title: string;
  href: string;
}

function findCrumbs(pathname: string): Crumb[] {
  for (const item of NAVIGATION) {
    if (item.href === pathname) {
      return [{ title: item.title, href: item.href }];
    }
    if (item.children) {
      for (const child of item.children) {
        if (pathname.startsWith(child.href)) {
          return [
            { title: item.title, href: item.href },
            { title: child.title, href: child.href },
          ];
        }
      }
      if (pathname.startsWith(item.href)) {
        return [{ title: item.title, href: item.href }];
      }
    }
  }
  return [];
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const crumbs = findCrumbs(pathname);

  if (crumbs.length === 0) {
    return null;
  }

  return (
    <nav className="hidden items-center gap-1 text-sm text-muted-foreground sm:flex">
      {crumbs.map((crumb, index) => (
        <Fragment key={crumb.href}>
          {index > 0 && <ChevronRight className="h-4 w-4" />}
          <Link
            href={crumb.href}
            className={
              index === crumbs.length - 1 ? 'font-medium text-foreground' : 'hover:text-foreground'
            }
          >
            {crumb.title}
          </Link>
        </Fragment>
      ))}
    </nav>
  );
}
