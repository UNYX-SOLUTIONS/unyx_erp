export {};

declare global {
  interface AuthUser {
    id: string;
    companyId: string;
    branchId: string | null;
    isSuperAdmin: boolean;
  }
}
