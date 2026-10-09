import { Router } from 'express';
import { EvidenceController } from '../controllers/evidenceController';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware';

const router = Router();
const evidenceController = new EvidenceController();

router.use(authenticateToken);

router.get('/:id', evidenceController.getEvidenceById);
router.patch('/:id/review', requireAdmin, evidenceController.reviewEvidence);
router.get('/:id/download', evidenceController.downloadEvidence);

export default router;
