import { Router } from 'express';
import { ClientController } from '../controllers/index.js';

const router = Router();
const controller = new ClientController();

router.get('/', (req, res, next) => controller.getAll(req, res, next));
router.get('/:apiKey', (req, res, next) => controller.getOne(req, res, next));
router.post('/', (req, res, next) => controller.create(req, res, next));
router.put('/:apiKey', (req, res, next) => controller.update(req, res, next));
router.delete('/:apiKey', (req, res, next) => controller.remove(req, res, next));

export default router;