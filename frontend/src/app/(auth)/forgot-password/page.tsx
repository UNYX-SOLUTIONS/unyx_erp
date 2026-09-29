import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { KeyRound } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Recuperar contraseña',
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-6">
      <div className="mb-8 flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-black">
        <Image src="/logo-mark.svg" alt="UNYX ERP" width={32} height={32} />
      </div>
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <KeyRound className="h-5 w-5" />
            </div>
            <CardTitle>Recuperar contraseña</CardTitle>
            <CardDescription>
              El restablecimiento de contraseñas estará disponible próximamente. Por ahora contacta
              al administrador de tu empresa.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login" className="text-sm text-primary underline-offset-4 hover:underline">
              Volver a iniciar sesión
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
