import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DELIVERY_ITEMS } from '../data/mock';
import { StatusBadge } from './StatusBadge';

export function DeliveryTimeline({ className }: { className?: string }) {
  return (
    <section className={className}>
      <div className="rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <header className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Entregas de hoy</h2>
            <span className="rounded-full bg-gray-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-slate-300">
              {DELIVERY_ITEMS.length} rutas
            </span>
          </div>
          <Link
            href="/operations/logistics/schedule"
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            Ver agenda
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </header>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-10 px-5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                Ventana
              </TableHead>
              <TableHead className="h-10 px-5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                Pedido
              </TableHead>
              <TableHead className="h-10 px-5 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                Estado
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {DELIVERY_ITEMS.map((item) => (
              <TableRow key={item.id} className="border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                <TableCell className="px-5 py-3.5 text-sm font-medium text-gray-900 dark:text-slate-100">
                  {item.ventana}
                </TableCell>
                <TableCell className="px-5 py-3.5 text-sm font-semibold text-blue-600">
                  {item.pedido}
                </TableCell>
                <TableCell className="px-5 py-3.5 text-right">
                  <StatusBadge label={item.estado} color={item.estadoColor} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
