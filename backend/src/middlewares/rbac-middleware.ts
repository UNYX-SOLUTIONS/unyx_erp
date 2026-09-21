import { StatusCodes } from 'http-status-codes';
import { ApiError } from '../utils/api-error';
import { asyncHandler } from '../utils/async-handler';
import { getUserPermissionCodes } from '../modules/auth/auth-service';

export function requirePermission(code: string) {
  return asyncHandler(async (req, _res, next) => {
    if (!req.user) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Usuario no autenticado', 'AUTH_REQUIRED');
    }
    if (req.user.isSuperAdmin) {
      next();
      return;
    }
    const codes = await getUserPermissionCodes(req.user.id);
    const [moduleName] = code.split('.');
    const hasPermission = codes.has(code) || codes.has(`${moduleName}.*`) || codes.has('*');
    if (!hasPermission) {
      throw new ApiError(StatusCodes.FORBIDDEN, `Permiso requerido: ${code}`, 'RBAC_FORBIDDEN');
    }
    next();
  });
}
