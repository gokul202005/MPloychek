import { Router } from 'express';
import { TelemetryController } from '../controllers/telemetryController';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware';

const router = Router();
const telemetryController = new TelemetryController();

// Public ping and health
router.post('/ping', telemetryController.ping);

// Admin-only telemetry metrics
router.get('/summary', authenticateToken, requireAdmin, telemetryController.getSummary);
router.get('/requests', authenticateToken, requireAdmin, telemetryController.getRequests);
router.post('/delay', authenticateToken, requireAdmin, telemetryController.setSimulatedDelay);

export default router;
