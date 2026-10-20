import { Router } from 'express';
import { authenticate } from '../../middlewares/auth-middleware';
import { validate } from '../../middlewares/validate-middleware';
import * as contificoController from './contifico-controller';
import {
  contificoProductIdParamSchema,
  contificoProductsQuerySchema,
  contificoSyncBodySchema,
} from './contifico-schema';

export const contificoRoutes = Router();

contificoRoutes.use(authenticate);

contificoRoutes.get('/status', contificoController.status);
contificoRoutes.post('/sync', validate(contificoSyncBodySchema), contificoController.sync);
contificoRoutes.get(
  '/products',
  validate(contificoProductsQuerySchema, 'query'),
  contificoController.listProducts
);
contificoRoutes.get(
  '/products/:id',
  validate(contificoProductIdParamSchema, 'params'),
  contificoController.getProduct
);
contificoRoutes.get('/categories', contificoController.listCategories);
