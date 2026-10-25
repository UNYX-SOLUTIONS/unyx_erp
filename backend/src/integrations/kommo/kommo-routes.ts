import { Router } from 'express';
import { authenticate } from '../../middlewares/auth-middleware';
import * as kommoController from './kommo-controller';

export const kommoRoutes = Router();

kommoRoutes.use(authenticate);

kommoRoutes.get('/templates', kommoController.listTemplates);
kommoRoutes.post('/sync-templates', kommoController.syncTemplates);
