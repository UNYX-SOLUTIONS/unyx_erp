'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { AxiosError } from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { cn, getApiErrorMessage } from '@/lib/utils';
import { loginSchema, type LoginInput } from '../schemas/auth-schema';
import { useLogin } from '../hooks/useLogin';

export function LoginForm() {
  const router = useRouter();
  const login = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = form.handleSubmit((values) => {
    setGeneralError(null);
    login.mutate(values, {
      onSuccess: () => {
        toast.success('Bienvenido');
        router.push('/operations/dashboard');
      },
      onError: (error) => {
        const hasResponse = Boolean((error as AxiosError | undefined)?.response);
        setGeneralError(
          hasResponse
            ? getApiErrorMessage(error, 'Correo o contraseña incorrectos.')
            : 'No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.'
        );
      },
    });
  });

  const emailError = form.formState.errors.email?.message;
  const hasEmailError = Boolean(emailError) || Boolean(generalError);
  const hasPasswordError = Boolean(form.formState.errors.password?.message) || Boolean(generalError);
  const inputContainerClass = (hasError: boolean) =>
    cn(
      'flex h-[50px] w-full items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 transition-all duration-150 focus-within:border-unyx-700 focus-within:shadow-[0_0_0_3px_rgba(30,64,175,0.08)]',
      hasError && 'border-rose-500 shadow-[0_0_0_3px_rgba(239,68,68,0.08)]'
    );

  return (
    <div>
      <div className="mb-8">
        <h1 className="mb-2 text-[28px] font-semibold leading-tight tracking-tight text-slate-900 dark:text-slate-100 sm:text-[30px]">
          Bienvenido a UNYX ERP
        </h1>
        <p className="text-[14px] font-normal leading-relaxed text-slate-500 dark:text-slate-400">
          Ingresa tus credenciales para acceder a tu espacio de trabajo.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
          >
            Correo Electrónico
          </label>
          <div className={inputContainerClass(hasEmailError)}>
            <Mail className="mr-3 h-5 w-5 shrink-0 text-slate-400" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="nombre@empresa.com"
              className="h-full w-full bg-transparent text-[14px] font-normal text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
              {...form.register('email')}
            />
          </div>
          {emailError && (
            <p className="flex items-center gap-1 pt-0.5 text-[12px] font-medium text-rose-600">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{emailError}</span>
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
          >
            Contraseña
          </label>
          <div className={inputContainerClass(hasPasswordError)}>
            <Lock className="mr-3 h-5 w-5 shrink-0 text-slate-400" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••••••"
              className={cn(
                'h-full w-full bg-transparent text-[14px] font-normal text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none',
                !showPassword && 'tracking-widest'
              )}
              {...form.register('password')}
            />
            <button
              type="button"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              onClick={() => setShowPassword((value) => !value)}
              className="p-1 text-slate-400 transition-colors hover:text-slate-600 focus:outline-none"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {form.formState.errors.password?.message && (
            <p className="flex items-center gap-1 pt-0.5 text-[12px] font-medium text-rose-600">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{form.formState.errors.password.message}</span>
            </p>
          )}
          {generalError && (
            <div className="flex items-center gap-1.5 pt-1 text-[12px] font-medium text-rose-600">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-500" />
              <span>{generalError}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-1">
          <label className="group flex cursor-pointer select-none items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-unyx-800 transition focus:ring-0 focus:ring-offset-0"
            />
            <span className="text-[13px] text-slate-600 dark:text-slate-300 transition-colors group-hover:text-slate-800">
              Mantener sesión iniciada
            </span>
          </label>
          <Link
            href="/forgot-password"
            className="text-[13px] font-medium text-unyx-700 transition-colors hover:text-unyx-800 hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={login.isPending}
            className="group flex h-[50px] w-full items-center justify-center gap-2 rounded-lg bg-unyx-700 text-[15px] font-medium text-white shadow-sm transition-all duration-150 hover:bg-unyx-800 hover:shadow active:scale-[0.99] active:bg-unyx-900 focus:outline-none focus:ring-2 focus:ring-unyx-700 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-80"
          >
            {login.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Iniciando sesión...</span>
              </>
            ) : (
              <>
                <span>Iniciar sesión</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </div>

        <div className="flex select-none items-center justify-center gap-1.5 pt-3 text-slate-400">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span className="text-[12px] font-normal tracking-tight text-slate-500 dark:text-slate-400">
            Acceso seguro administrado por UNYX
          </span>
        </div>
      </form>
    </div>
  );
}
