import crypto from 'node:crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export function signAccessToken(user: AuthUser): string {
  return jwt.sign(
    { companyId: user.companyId, branchId: user.branchId, isSuperAdmin: user.isSuperAdmin },
    env.JWT_ACCESS_SECRET,
    { subject: user.id, expiresIn: env.JWT_ACCESS_EXPIRES as SignOptions['expiresIn'] }
  );
}

export function verifyAccessToken(token: string): AuthUser {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as jwt.JwtPayload;
  return {
    id: payload.sub as string,
    companyId: payload.companyId as string,
    branchId: (payload.branchId as string | null) ?? null,
    isSuperAdmin: payload.isSuperAdmin as boolean,
  };
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({}, env.JWT_REFRESH_SECRET, {
    subject: userId,
    expiresIn: env.JWT_REFRESH_EXPIRES as SignOptions['expiresIn'],
  });
}

export function verifyRefreshToken(token: string): string {
  const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as jwt.JwtPayload;
  if (!payload.sub) {
    throw new Error('Refresh token sin subject');
  }
  return payload.sub;
}

export function getRefreshTokenExpiry(token: string): Date {
  const payload = jwt.decode(token) as jwt.JwtPayload;
  return new Date((payload.exp as number) * 1000);
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
