import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ATTENTION_ITEMS } from '../data/mock';
import { StatusBadge } from './StatusBadge';

export function AttentionTable({ className }: { className?: string }) {
  return (
    <section className={className}>
      <div className="rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <header className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Requieren atención</h2>
            <span className="rounded-full bg-gray-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-slate-300">
              {ATTENTION_ITEMS.length}
            </span>
          </div>
          <span className="text-xs text-gray-400 dark:text-slate-500">Actualizado hace 1m</span>
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
                Situación
              </TableHead>
              <TableHead className="h-10 px-5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                Responsable
              </TableHead>
              <TableHead className="h-10 px-5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                Registro
              </TableHead>
              <TableHead className="h-10 px-5 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                Acción
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ATTENTION_ITEMS.map((item) => (
              <TableRow key={item.id} className="border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                <TableCell className="px-5 py-3.5 text-sm font-semibold text-gray-900 dark:text-slate-100">
                  {item.pedido}
                </TableCell>
                <TableCell className="px-5 py-3.5 text-sm text-gray-700 dark:text-slate-300">{item.cliente}</TableCell>
                <TableCell className="px-5 py-3.5">
                  <StatusBadge label={item.situacion} color={item.situacionColor} />
                </TableCell>
                <TableCell className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 text-[10px] font-semibold text-gray-600 dark:text-slate-300">
                      {item.responsableIniciales}
                    </span>
                    <span className="text-sm text-gray-700 dark:text-slate-300">{item.responsableNombre}</span>
                  </div>
                </TableCell>
                <TableCell className="px-5 py-3.5 text-sm text-gray-500 dark:text-slate-400">{item.registro}</TableCell>
                <TableCell className="px-5 py-3.5 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800/50"
                  >
                    {item.accion}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
