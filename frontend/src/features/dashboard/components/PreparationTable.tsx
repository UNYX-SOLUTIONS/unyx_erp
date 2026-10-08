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
import { PREPARATION_ITEMS } from '../data/mock';
import { ProgressBar } from './ProgressBar';
import { StatusBadge } from './StatusBadge';

export function PreparationTable({ className }: { className?: string }) {
  return (
    <section className={className}>
      <div className="rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <header className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Pedidos en preparación</h2>
            <span className="rounded-full bg-gray-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-slate-300">
              {PREPARATION_ITEMS.length} activos
            </span>
          </div>
          <Link
            href="/operations/orders"
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            Ver todos los pedidos
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </header>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-10 px-5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                Pedido
              </TableHead>
              <TableHead className="h-10 px-5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                Cliente
              </TableHead>
              <TableHead className="h-10 px-5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                Productos
              </TableHead>
              <TableHead className="h-10 px-5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                Responsable
              </TableHead>
              <TableHead className="h-10 px-5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                Progreso
              </TableHead>
              <TableHead className="h-10 px-5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                Estado
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {PREPARATION_ITEMS.map((item) => (
              <TableRow key={item.id} className="border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                <TableCell className="px-5 py-3.5 text-sm font-semibold text-gray-900 dark:text-slate-100">
                  {item.pedido}
                </TableCell>
                <TableCell className="px-5 py-3.5 text-sm text-gray-700 dark:text-slate-300">{item.cliente}</TableCell>
                <TableCell className="px-5 py-3.5 text-sm text-gray-500 dark:text-slate-400">{item.productos}</TableCell>
                <TableCell className="px-5 py-3.5 text-sm text-gray-700 dark:text-slate-300">{item.responsable}</TableCell>
                <TableCell className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <ProgressBar value={item.progreso} className="w-24" />
                    <span className="text-xs font-medium text-gray-500 dark:text-slate-400">{item.progreso}%</span>
                  </div>
                </TableCell>
                <TableCell className="px-5 py-3.5">
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
