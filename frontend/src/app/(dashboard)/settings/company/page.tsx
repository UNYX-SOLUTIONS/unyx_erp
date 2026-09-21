'use client';

import { Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';

export default function CompanySettingsPage() {
  const { company } = useCurrentUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Empresa</h1>
        <p className="text-muted-foreground">Configuración de tu empresa</p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>{company?.name ?? 'Sin empresa'}</CardTitle>
              <CardDescription>
                Moneda: {company?.currency ?? '—'} · Zona horaria: {company?.timezone ?? '—'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            El formulario de edición se conectará al endpoint de empresas del backend.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
