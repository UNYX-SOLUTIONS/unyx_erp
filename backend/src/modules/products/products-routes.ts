import { Router } from 'express';
import { validate } from '../../middlewares/validate-middleware';
import * as productsController from './products-controller';
import {
  createProductSchema,
  createVariantSchema,
  listProductsQuerySchema,
  productIdParamSchema,
  updateProductSchema,
  updateVariantSchema,
  variantParamsSchema,
} from './products-schema';

export const productsRoutes = Router();

// Cuando se active el auth en estas rutas, encadenar antes de los handlers:
//   authenticate, requirePermission('products.read' | 'products.create' | 'products.update' | 'products.delete')
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

productsRoutes.get(
  '/:id/variants',
  validate(productIdParamSchema, 'params'),
  productsController.listVariants
);
productsRoutes.post(
  '/:id/variants',
  validate(productIdParamSchema, 'params'),
  validate(createVariantSchema),
  productsController.addVariant
);
productsRoutes.patch(
  '/:id/variants/:variantId',
  validate(variantParamsSchema, 'params'),
  validate(updateVariantSchema),
  productsController.updateVariant
);
productsRoutes.delete(
  '/:id/variants/:variantId',
  validate(variantParamsSchema, 'params'),
  productsController.removeVariant
);
