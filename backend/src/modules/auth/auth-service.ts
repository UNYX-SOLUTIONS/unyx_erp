import { StatusCodes } from 'http-status-codes';
import type { User } from '@prisma/client';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { ApiError } from '../../utils/api-error';
import { hashPassword, comparePassword } from '../../utils/password';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  getRefreshTokenExpiry,
} from '../../utils/jwt';
import { writeAudit } from '../../utils/audit';
import { seedCompanyRoles } from './role-templates';
import type { RegisterInput, LoginInput, RefreshInput } from './auth-schema';
import type { AuthSessionMeta, AuthTokens, AuthResponse, MeResponse, SafeUser } from './auth-types';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    companyId: user.companyId,
    branchId: user.branchId,
    email: user.email,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: user.avatarUrl,
    phone: user.phone,
    isActive: user.isActive,
    isSuperAdmin: user.isSuperAdmin,
    emailVerified: user.emailVerified,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
}

async function issueTokens(user: User, meta: AuthSessionMeta): Promise<AuthTokens> {
  const accessToken = signAccessToken({
    id: user.id,
    companyId: user.companyId,
    branchId: user.branchId ?? null,
    isSuperAdmin: user.isSuperAdmin,
  });
  const refreshToken = signRefreshToken(user.id);
  await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken: hashToken(refreshToken),
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
      expiresAt: getRefreshTokenExpiry(refreshToken),
    },
  });
  return { accessToken, refreshToken, expiresIn: env.JWT_ACCESS_EXPIRES };
}

export async function register(input: RegisterInput, meta: AuthSessionMeta): Promise<AuthResponse> {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: input.email }, { username: input.username }] },
  });
  if (existing) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      'El email o nombre de usuario ya está registrado',
      'AUTH_USER_EXISTS'
    );
  }

  const user = await prisma.$transaction(async (tx) => {
    const company = await tx.company.create({ data: { name: input.companyName } });
    const created = await tx.user.create({
      data: {
        companyId: company.id,
        email: input.email,
        username: input.username,
        passwordHash: await hashPassword(input.password),
        firstName: input.firstName,
        lastName: input.lastName,
        isSuperAdmin: true,
      },
    });
    await seedCompanyRoles(tx, company.id);
    const adminRole = await tx.role.findUnique({
      where: { companyId_name: { companyId: company.id, name: 'Admin' } },
    });
    if (adminRole) {
      await tx.userRole.create({ data: { userId: created.id, roleId: adminRole.id } });
    }
    return created;
  });

  const tokens = await issueTokens(user, meta);
  await writeAudit({
    companyId: user.companyId,
    userId: user.id,
    action: 'auth.register',
    entity: 'User',
    entityId: user.id,
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  });
  return { user: toSafeUser(user), tokens };
}

export async function login(input: LoginInput, meta: AuthSessionMeta): Promise<AuthResponse> {
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: input.identifier }, { username: input.identifier }] },
  });
  if (!user) {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      'Credenciales inválidas',
      'AUTH_INVALID_CREDENTIALS'
    );
  }
  if (!user.isActive) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Cuenta desactivada', 'AUTH_ACCOUNT_DISABLED');
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new ApiError(
      StatusCodes.LOCKED,
      'Cuenta bloqueada temporalmente, intente más tarde',
      'AUTH_ACCOUNT_LOCKED'
    );
  }

  const isValid = await comparePassword(input.password, user.passwordHash);
  if (!isValid) {
    const failedAttempts = user.failedAttempts + 1;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedAttempts,
        lockedUntil:
          failedAttempts >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCK_DURATION_MS) : null,
      },
    });
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      'Credenciales inválidas',
      'AUTH_INVALID_CREDENTIALS'
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
  });
  const tokens = await issueTokens(user, meta);
  return { user: toSafeUser(user), tokens };
}

export async function refresh(input: RefreshInput, meta: AuthSessionMeta): Promise<AuthResponse> {
  let userId: string;
  try {
    userId = verifyRefreshToken(input.refreshToken);
  } catch {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      'Refresh token inválido o expirado',
      'AUTH_REFRESH_INVALID'
    );
  }

  const session = await prisma.session.findUnique({
    where: { refreshToken: hashToken(input.refreshToken) },
  });
  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      'Sesión expirada o revocada',
      'AUTH_SESSION_INVALID'
    );
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.isActive) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Usuario no disponible', 'AUTH_USER_UNAVAILABLE');
  }

  await prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
  const tokens = await issueTokens(user, meta);
  return { user: toSafeUser(user), tokens };
}

export async function logout(rawRefreshToken: string): Promise<void> {
  await prisma.session.updateMany({
    where: { refreshToken: hashToken(rawRefreshToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function getMe(userId: string): Promise<MeResponse> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: { select: { code: true } } },
              },
            },
          },
        },
      },
      company: { select: { id: true, name: true, currency: true, timezone: true } },
    },
  });
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Usuario no encontrado', 'USER_NOT_FOUND');
  }
  const permissions = Array.from(
    new Set(
      user.roles.flatMap((userRole) => userRole.role.permissions.map((rp) => rp.permission.code))
    )
  );
  return { user: toSafeUser(user), company: user.company, permissions };
}

export async function getUserPermissionCodes(userId: string): Promise<Set<string>> {
  const links = await prisma.userRole.findMany({
    where: { userId },
    select: {
      role: {
        select: {
          permissions: {
            select: { permission: { select: { code: true } } },
          },
        },
      },
    },
  });
  return new Set(links.flatMap((link) => link.role.permissions.map((rp) => rp.permission.code)));
}
