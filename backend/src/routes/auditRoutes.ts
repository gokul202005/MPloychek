import { Router } from 'express';
import { AuditController } from '../controllers/auditController';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware';

const router = Router();
const auditController = new AuditController();

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/', auditController.getAuditEvents);
router.get('/:id', auditController.getAuditEventById);

export default router;
