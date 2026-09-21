export interface SafeUser {
  id: string;
  companyId: string;
  branchId: string | null;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  phone: string | null;
  isActive: boolean;
  isSuperAdmin: boolean;
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface CompanySummary {
  id: string;
  name: string;
  currency: string;
  timezone: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AuthResponse {
  user: SafeUser;
  tokens: AuthTokens;
}

export interface MeResponse {
  user: SafeUser;
  company: CompanySummary;
  permissions: string[];
}
