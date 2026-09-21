import { StatusCodes } from 'http-status-codes';
import { ZodSchema } from 'zod';
import { ApiError } from '../utils/api-error';
import { asyncHandler } from '../utils/async-handler';

type ValidationSource = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, source: ValidationSource = 'body') {
  return asyncHandler(async (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Datos inválidos',
        'VALIDATION_ERROR',
        result.error.flatten().fieldErrors
      );
    }
    req[source] = result.data;
    next();
  });
}
