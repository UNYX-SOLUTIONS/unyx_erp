import type { Metadata } from 'next';
import { Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Usuarios',
};

export default function UsersSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Usuarios</h1>
        <p className="text-muted-foreground">Administra los usuarios de tu empresa</p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Módulo en construcción</CardTitle>
              <CardDescription>
                La gestión de usuarios se conectará al endpoint de usuarios del backend.
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
