import { Router } from 'express';
import { RateLimitController } from '../controllers/index.js';

const router = Router();
const controller = new RateLimitController();

router.post('/', (req, res, next) => controller.check(req, res, next));
router.get('/audit', (req, res) => controller.auditLog(req, res));
router.get('/stats', (req, res) => controller.stats(req, res));
router.delete('/cache', (req, res, next) => controller.clearCache(req, res, next));

export default router;