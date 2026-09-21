'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { FormField } from '@/components/forms/FormField';
import { FormError } from '@/components/forms/FormError';
import { loginSchema, type LoginInput } from '../schemas/auth-schema';
import { useLogin } from '../hooks/useLogin';
import { getApiErrorMessage } from '@/lib/utils';

export function LoginForm() {
  const router = useRouter();
  const login = useLogin();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  });

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);
    login.mutate(values, {
      onSuccess: () => {
        toast.success('Bienvenido');
        router.push('/dashboard');
      },
      onError: (error) => setFormError(getApiErrorMessage(error, 'No se pudo iniciar sesión')),
    });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Iniciar sesión</CardTitle>
        <CardDescription>Ingresa con tu email o nombre de usuario</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <FormField
              name="identifier"
              label="Email o usuario"
              placeholder="admin@unyx.erp"
              control={form.control}
            />
            <FormField
              name="password"
              label="Contraseña"
              placeholder="••••••••"
              type="password"
              control={form.control}
            />
            <FormError message={formError} />
            <Button type="submit" className="w-full" disabled={login.isPending}>
              {login.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar
            </Button>
          </form>
        </Form>
        <div className="mt-4 flex flex-col gap-2 text-center text-sm">
          <Link href="/forgot-password" className="text-primary underline-offset-4 hover:underline">
            Olvidé mi contraseña
          </Link>
          <p className="text-muted-foreground">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="text-primary underline-offset-4 hover:underline">
              Regístrate
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
