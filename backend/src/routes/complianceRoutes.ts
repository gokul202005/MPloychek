import { Router } from 'express';
import { ComplianceController } from '../controllers/complianceController';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware';

const router = Router();
const complianceController = new ComplianceController();

router.use(authenticateToken);

router.get('/deadlines', complianceController.getDeadlines);
router.post('/deadlines', requireAdmin, complianceController.createDeadline);
router.patch('/deadlines/:id', requireAdmin, complianceController.updateDeadline);

export default router;
