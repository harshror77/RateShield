import {Router} from 'express'
import {RateLimitController} from '../controllers/index.js';

const router = Router();
const controller = new RateLimitController();

router.post('/',(req,res,next)=> controller.check(req,res,next));

export default router;