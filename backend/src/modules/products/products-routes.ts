import { Router } from 'express';
import { validate } from '../../middlewares/validate-middleware';
import * as productsController from './products-controller';
import {
  createProductSchema,
  listProductsQuerySchema,
  productIdParamSchema,
  updateProductSchema,
} from './products-schema';

export const productsRoutes = Router();

// Cuando se active el auth en esta ruta, encadenar antes de los handlers:
//   authenticate, requirePermission('products.read') | 'products.create' | 'products.update' | 'products.delete'
productsRoutes.get('/', validate(listProductsQuerySchema, 'query'), productsController.list);
productsRoutes.get('/:id', validate(productIdParamSchema, 'params'), productsController.getById);
productsRoutes.post('/', validate(createProductSchema), productsController.create);
productsRoutes.patch(
  '/:id',
  validate(productIdParamSchema, 'params'),
  validate(updateProductSchema),
  productsController.update
);
productsRoutes.delete(
  '/:id',
  validate(productIdParamSchema, 'params'),
  productsController.remove
);
