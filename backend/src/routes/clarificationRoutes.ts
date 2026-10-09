import { Router } from 'express';
import { ClarificationController } from '../controllers/clarificationController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();
const clarController = new ClarificationController();

router.use(authenticateToken);

router.post('/:id/respond', clarController.respondClarification);

export default router;
