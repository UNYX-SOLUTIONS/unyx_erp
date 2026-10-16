import { Router } from 'express';
import { authenticate } from '../../middlewares/auth-middleware';
import { validate } from '../../middlewares/validate-middleware';
import * as altosaController from './altosa-controller';
import {
  altosaActiveQuerySchema,
  altosaDocumentsQuerySchema,
  altosaIdParamSchema,
  altosaProductsQuerySchema,
  altosaSkuParamSchema,
} from './altosa-schema';

export const altosaRoutes = Router();

// Datos del cliente Altosa (solo lectura): requieren sesión del ERP.
// El navegador nunca habla con altosa-api: todo pasa por aquí (patrón BFF).
altosaRoutes.use(authenticate);

altosaRoutes.get(
  '/products',
  validate(altosaProductsQuerySchema, 'query'),
  altosaController.listProducts
);
altosaRoutes.get(
  '/products/sku/:sku',
  validate(altosaSkuParamSchema, 'params'),
  altosaController.getProductBySku
);
altosaRoutes.get(
  '/products/:id',
  validate(altosaIdParamSchema, 'params'),
  altosaController.getProductById
);

altosaRoutes.get('/categories', altosaController.listCategories);
altosaRoutes.get(
  '/catalogs',
  validate(altosaActiveQuerySchema, 'query'),
  altosaController.listCatalogs
);
altosaRoutes.get(
  '/locations',
  validate(altosaActiveQuerySchema, 'query'),
  altosaController.listLocations
);
altosaRoutes.get(
  '/warranties',
  validate(altosaActiveQuerySchema, 'query'),
  altosaController.listWarranties
);
altosaRoutes.get(
  '/documents',
  validate(altosaDocumentsQuerySchema, 'query'),
  altosaController.listDocuments
);
