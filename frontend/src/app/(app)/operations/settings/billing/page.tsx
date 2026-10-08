import type { Metadata } from 'next';
import { CreditCard } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Facturación',
};

export default function BillingSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Facturación</h1>
        <p className="text-muted-foreground">Plan y pagos de tu suscripción</p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted dark:bg-slate-800">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Módulo en construcción</CardTitle>
              <CardDescription>
                El módulo de facturación y planes estará disponible próximamente.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            La estructura ya está lista para agregar el código.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
