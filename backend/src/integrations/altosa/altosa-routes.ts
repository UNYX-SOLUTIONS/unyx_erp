import { Router } from 'express';
import multer from 'multer';
import { StatusCodes } from 'http-status-codes';
import { ApiError } from '../../utils/api-error';
import { authenticate } from '../../middlewares/auth-middleware';
import { validate } from '../../middlewares/validate-middleware';
import * as altosaController from './altosa-controller';
import {
  altosaActiveQuerySchema,
  altosaCreateProductBodySchema,
  altosaDocumentsQuerySchema,
  altosaIdParamSchema,
  altosaProductsQuerySchema,
  altosaSkuParamSchema,
  altosaUpdateProductBodySchema,
  altosaUpdateVariantBodySchema,
  altosaVariantBodySchema,
} from './altosa-schema';

export const altosaRoutes = Router();

const ALLOWED_IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_IMAGE_MIME.has(file.mimetype)) {
      callback(
        new ApiError(
          StatusCodes.BAD_REQUEST,
          'Formato no permitido. Usa JPG, PNG, WEBP o GIF.',
          'UPLOAD_INVALID_TYPE'
        )
      );
      return;
    }
    callback(null, true);
  },
});

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
altosaRoutes.post(
  '/products',
  validate(altosaCreateProductBodySchema),
  altosaController.createProduct
);
altosaRoutes.patch(
  '/products/:id',
  validate(altosaIdParamSchema, 'params'),
  validate(altosaUpdateProductBodySchema),
  altosaController.updateProduct
);
altosaRoutes.delete(
  '/products/:id',
  validate(altosaIdParamSchema, 'params'),
  altosaController.deleteProduct
);
altosaRoutes.post(
  '/products/:id/variants',
  validate(altosaIdParamSchema, 'params'),
  validate(altosaVariantBodySchema),
  altosaController.createVariant
);
altosaRoutes.patch(
  '/variants/:id',
  validate(altosaIdParamSchema, 'params'),
  validate(altosaUpdateVariantBodySchema),
  altosaController.updateVariant
);
altosaRoutes.delete(
  '/variants/:id',
  validate(altosaIdParamSchema, 'params'),
  altosaController.deleteVariant
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

// Subida de imágenes de variantes (pasa directo a altosa-api).
altosaRoutes.post(
  '/uploads/variants',
  imageUpload.single('file'),
  altosaController.uploadVariantImage
);
