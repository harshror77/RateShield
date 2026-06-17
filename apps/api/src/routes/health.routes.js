import { Router } from 'express';
import { HealthController } from '../controllers/index.js';

const router = Router();
const controller = new HealthController();

router.get('/', (req, res, next) => controller.check(req, res, next));

export default router;