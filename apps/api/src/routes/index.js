import { Router } from 'express';
import rateLimitRoutes from './rateLimit.routes.js';
import clientRoutes from './client.routes.js';

const router = Router();

router.use('/check', rateLimitRoutes);
router.use('/clients', clientRoutes);

export default router;