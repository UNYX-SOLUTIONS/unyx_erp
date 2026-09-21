import type { User } from '@prisma/client';

export type SafeUser = Omit<
  User,
  'passwordHash' | 'failedAttempts' | 'lockedUntil' | 'deletedAt' | 'updatedAt'
>;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AuthSessionMeta {
  userAgent?: string;
  ipAddress?: string;
}

export interface AuthResponse {
  user: SafeUser;
  tokens: AuthTokens;
}

export interface MeResponse {
  user: SafeUser;
  company: { id: string; name: string; currency: string; timezone: string };
  permissions: string[];
}
