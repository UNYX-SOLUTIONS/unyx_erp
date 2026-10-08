'use client';

import { User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { formatDateTime } from '@/lib/formatters';

export default function ProfilePage() {
  const { user } = useCurrentUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mi perfil</h1>
        <p className="text-muted-foreground">Información de tu cuenta</p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted dark:bg-slate-800">
              <User className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>
                {user?.firstName} {user?.lastName}
              </CardTitle>
              <CardDescription>@{user?.username}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{user?.email}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Último acceso</p>
            <p className="font-medium">
              {user?.lastLoginAt ? formatDateTime(user.lastLoginAt) : '—'}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Rol</p>
            <p className="font-medium">{user?.isSuperAdmin ? 'Super administrador' : 'Usuario'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Estado</p>
            <p className="font-medium">{user?.isActive ? 'Activo' : 'Inactivo'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
