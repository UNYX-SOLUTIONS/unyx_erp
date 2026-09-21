import { z } from 'zod';

export const registerSchema = z.object({
  companyName: z.string().trim().min(2).max(120),
  firstName: z.string().trim().min(2).max(60),
  lastName: z.string().trim().min(2).max(60),
  email: z.string().trim().toLowerCase().email(),
  username: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9._-]+$/, 'Solo letras, números, punto, guion y guion bajo'),
  password: z
    .string()
    .min(8)
    .max(72)
    .regex(/[A-Za-z]/, 'Debe contener al menos una letra')
    .regex(/\d/, 'Debe contener al menos un número'),
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(3),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(20),
});

export const logoutSchema = refreshSchema;

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
