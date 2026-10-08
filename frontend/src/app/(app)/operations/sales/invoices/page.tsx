import type { Metadata } from 'next';
import { FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Facturas',
};

export default function InvoicesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Facturas</h1>
        <p className="text-muted-foreground">Facturación electrónica de tus ventas</p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Módulo en construcción</CardTitle>
              <CardDescription>
                El módulo de facturación se conectará al endpoint de facturas del backend.
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
