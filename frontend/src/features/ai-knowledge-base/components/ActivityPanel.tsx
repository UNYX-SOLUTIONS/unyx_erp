import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ACTIVITY_ITEMS } from '../data/mock';
import type { AvatarTone, BadgeTone } from '../types/knowledge-base-types';

const AVATAR_TONE_CLASSES: Record<AvatarTone, string> = {
  blue: 'bg-blue-100 text-blue-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  green: 'bg-green-100 text-green-700',
  gray: 'bg-gray-100 text-gray-600',
};

const META_TONE_CLASSES: Record<BadgeTone, string> = {
  green: 'text-green-600',
  yellow: 'text-yellow-600',
  orange: 'text-orange-600',
  red: 'text-red-600',
  blue: 'text-blue-600',
  gray: 'text-gray-500',
};

export function ActivityPanel({ className }: { className?: string }) {
  return (
    <section className={className}>
      <div className="flex h-full flex-col rounded-lg border border-gray-200 bg-white shadow-sm">
        <header className="flex items-start justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Actividad reciente</h2>
            <p className="mt-1 text-xs text-gray-500">
              Bitácora de modificaciones y aprobaciones comerciales
            </p>
          </div>
          <Link
            href="/ai/knowledge-base/summary"
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            Ver todo
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </header>

        <ul className="flex-1 divide-y divide-gray-100 px-5">
          {ACTIVITY_ITEMS.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-3.5">
              <Avatar className="h-9 w-9">
                <AvatarFallback
                  className={cn('text-[11px] font-semibold', AVATAR_TONE_CLASSES[item.avatarTone])}
                >
                  {item.avatar}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">{item.title}</p>
                <p className="truncate text-xs text-gray-500">{item.description}</p>
                {item.meta && (
                  <p className={cn('truncate text-xs', META_TONE_CLASSES[item.meta.tone])}>
                    {item.meta.text}
                  </p>
                )}
              </div>
              <span className="shrink-0 text-xs text-gray-400">{item.time}</span>
            </li>
          ))}
        </ul>

        <footer className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
          <Link
            href="/ai/knowledge-base/summary"
            className="text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            Historial de actividad
          </Link>
          <Button variant="outline" size="sm" className="border-gray-200 text-gray-700">
            Historial 30 días
          </Button>
        </footer>
      </div>
    </section>
  );
}
