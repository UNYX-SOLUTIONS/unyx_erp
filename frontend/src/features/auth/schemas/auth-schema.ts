import { z } from 'zod';

export const registerSchema = z.object({
  companyName: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(120),
  firstName: z.string().trim().min(2, 'El nombre es requerido').max(60),
  lastName: z.string().trim().min(2, 'El apellido es requerido').max(60),
  email: z.string().trim().toLowerCase().email('Email inválido'),
  username: z
    .string()
    .trim()
    .min(3, 'Mínimo 3 caracteres')
    .max(30)
    .regex(/^[a-zA-Z0-9._-]+$/, 'Solo letras, números, punto, guion y guion bajo'),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .max(72)
    .regex(/[A-Za-z]/, 'Debe contener al menos una letra')
    .regex(/\d/, 'Debe contener al menos un número'),
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(3, 'Ingresa tu email o usuario'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
