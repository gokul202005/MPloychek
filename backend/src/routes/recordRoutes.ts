import { Router } from 'express';
import { RecordController } from '../controllers/recordController';
import { EvidenceController } from '../controllers/evidenceController';
import { ClarificationController } from '../controllers/clarificationController';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware';
import { upload } from './uploadConfig';

const router = Router();
const recordController = new RecordController();
const evidenceController = new EvidenceController();
const clarController = new ClarificationController();

router.use(authenticateToken);

router.get('/', recordController.getRecords);
router.post('/', recordController.createRecord);
router.get('/:id', recordController.getRecordById);
router.patch('/:id', recordController.updateRecord);
router.post('/:id/decision', requireAdmin, recordController.recordDecision);
router.get('/:id/timeline', recordController.getTimeline);
router.get('/:id/evidence', recordController.getEvidence);
router.post('/:id/evidence', upload.single('file'), evidenceController.uploadEvidence);
router.get('/:id/clarifications', recordController.getClarifications);
router.post('/:id/clarifications', requireAdmin, clarController.createClarification);

export default router;
