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
import { registerSchema, type RegisterInput } from '../schemas/auth-schema';
import { useRegister } from '../hooks/useRegister';
import { getApiErrorMessage } from '@/lib/utils';

export function RegisterForm() {
  const router = useRouter();
  const register = useRegister();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      companyName: '',
      firstName: '',
      lastName: '',
      email: '',
      username: '',
      password: '',
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);
    register.mutate(values, {
      onSuccess: () => {
        toast.success('Cuenta creada correctamente');
        router.push('/dashboard');
      },
      onError: (error) => setFormError(getApiErrorMessage(error, 'No se pudo crear la cuenta')),
    });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear cuenta</CardTitle>
        <CardDescription>Registra tu empresa y tu usuario administrador</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <FormField
              name="companyName"
              label="Nombre de la empresa"
              placeholder="Mi Empresa S.A."
              control={form.control}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                name="firstName"
                label="Nombres"
                placeholder="Ana"
                control={form.control}
              />
              <FormField
                name="lastName"
                label="Apellidos"
                placeholder="López"
                control={form.control}
              />
            </div>
            <FormField
              name="email"
              label="Email"
              placeholder="ana@empresa.com"
              type="email"
              control={form.control}
            />
            <FormField
              name="username"
              label="Usuario"
              placeholder="ana_lopez"
              control={form.control}
            />
            <FormField
              name="password"
              label="Contraseña"
              placeholder="Mínimo 8 caracteres con letras y números"
              type="password"
              control={form.control}
            />
            <FormError message={formError} />
            <Button type="submit" className="w-full" disabled={register.isPending}>
              {register.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear cuenta
            </Button>
          </form>
        </Form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-primary underline-offset-4 hover:underline">
            Inicia sesión
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
