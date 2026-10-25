import { Router } from 'express';
import { authenticate } from '../../middlewares/auth-middleware';
import { validate } from '../../middlewares/validate-middleware';
import * as contificoController from './contifico-controller';
import {
  contificoImportBodySchema,
  contificoProductIdParamSchema,
  contificoProductsQuerySchema,
  contificoSearchQuerySchema,
  contificoSyncBodySchema,
} from './contifico-schema';

export const contificoRoutes = Router();

contificoRoutes.use(authenticate);

contificoRoutes.get('/status', contificoController.status);
contificoRoutes.post('/sync', validate(contificoSyncBodySchema), contificoController.sync);
contificoRoutes.get(
  '/search',
  validate(contificoSearchQuerySchema, 'query'),
  contificoController.searchProducts
);
contificoRoutes.post(
  '/import',
  validate(contificoImportBodySchema),
  contificoController.importProduct
);
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
