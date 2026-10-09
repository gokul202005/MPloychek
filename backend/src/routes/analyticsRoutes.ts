import { Router } from 'express';
import { AnalyticsController } from '../controllers/analyticsController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();
const analyticsController = new AnalyticsController();

router.use(authenticateToken);

router.get('/dashboard', analyticsController.getDashboardMetrics);
router.get('/overview', analyticsController.getOverview);

export default router;
