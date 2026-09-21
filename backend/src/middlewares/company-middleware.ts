import { StatusCodes } from 'http-status-codes';
import { ApiError } from '../utils/api-error';
import { asyncHandler } from '../utils/async-handler';

export const companyScope = asyncHandler(async (req, _res, next) => {
  if (!req.user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Usuario no autenticado', 'AUTH_REQUIRED');
  }
  if (req.user.isSuperAdmin) {
    next();
    return;
  }
  const paramCompanyId = req.params.companyId as string | undefined;
  const bodyCompanyId = (req.body as { companyId?: string } | undefined)?.companyId;
  const hasScopeViolation =
    (paramCompanyId && paramCompanyId !== req.user.companyId) ||
    (bodyCompanyId && bodyCompanyId !== req.user.companyId);
  if (hasScopeViolation) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'No tiene acceso a esta empresa',
      'COMPANY_SCOPE_VIOLATION'
    );
  }
  next();
});
