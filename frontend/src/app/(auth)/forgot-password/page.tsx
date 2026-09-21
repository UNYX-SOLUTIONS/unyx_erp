import type { Metadata } from 'next';
import Link from 'next/link';
import { KeyRound } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Recuperar contraseña',
};

export default function ForgotPasswordPage() {
  return (
    <Card>
      <CardHeader>
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
          <KeyRound className="h-5 w-5" />
        </div>
        <CardTitle>Recuperar contraseña</CardTitle>
        <CardDescription>
          El restablecimiento de contraseñas estará disponible próximamente. Por ahora contacta al
          administrador de tu empresa.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Link href="/login" className="text-sm text-primary underline-offset-4 hover:underline">
          Volver a iniciar sesión
        </Link>
      </CardContent>
    </Card>
  );
}
