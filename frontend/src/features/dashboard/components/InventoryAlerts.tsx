import Link from 'next/link';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { INVENTORY_ALERTS } from '../data/mock';
import { StatusBadge } from './StatusBadge';

export function InventoryAlerts({ className }: { className?: string }) {
  return (
    <section className={className}>
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <header className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-gray-900">Alertas de inventario</h2>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              {INVENTORY_ALERTS.length} alertas
            </span>
          </div>
          <Link
            href="/operations/warehouse/inventory"
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            Ver inventario
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </header>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-10 px-5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                SKU
              </TableHead>
              <TableHead className="h-10 px-5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Producto
              </TableHead>
              <TableHead className="h-10 px-5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Disponible
              </TableHead>
              <TableHead className="h-10 px-5 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Estado
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {INVENTORY_ALERTS.map((item) => (
              <TableRow key={item.id} className="border-gray-100 hover:bg-gray-50">
                <TableCell className="px-5 py-3.5 font-mono text-xs text-gray-500">
                  {item.sku}
                </TableCell>
                <TableCell className="px-5 py-3.5 text-sm text-gray-700">{item.producto}</TableCell>
                <TableCell className="px-5 py-3.5 text-sm text-gray-500">{item.disponible}</TableCell>
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
