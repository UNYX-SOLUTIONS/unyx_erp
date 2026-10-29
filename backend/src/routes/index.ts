import { Router } from 'express';
import { sendSuccess } from '../utils/api-response';
import { authRoutes } from '../modules/auth/auth-routes';
import { productsRoutes } from '../modules/products/products-routes';
import { altosaRoutes } from '../integrations/altosa/altosa-routes';
import { contificoProxyRoutes } from '../integrations/altosa/altosa-contifico-proxy';
import { kommoRoutes } from '../integrations/kommo/kommo-routes';

export const router = Router();

router.get('/health', (_req, res) => {
  sendSuccess(res, { status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/products', productsRoutes);
router.use('/integrations/altosa', altosaRoutes);
router.use('/integrations/contifico', contificoProxyRoutes);
router.use('/integrations/kommo', kommoRoutes);
