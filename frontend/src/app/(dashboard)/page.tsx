'use client';

import { BarChart3, Boxes, ShoppingCart, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';

const STATS = [
  { title: 'Ventas del día', value: '—', icon: ShoppingCart },
  { title: 'Productos activos', value: '—', icon: Boxes },
  { title: 'Clientes', value: '—', icon: Users },
  { title: 'Reportes', value: '—', icon: BarChart3 },
];

export default function DashboardPage() {
  const { user } = useCurrentUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Hola, {user?.firstName ?? 'bienvenido'}
        </h1>
        <p className="text-muted-foreground">
          Este es el panel principal de tu empresa. Los indicadores se conectarán a medida que
          actives los módulos.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
