import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();
const notifController = new NotificationController();

router.use(authenticateToken);

router.get('/', notifController.getNotifications);
router.patch('/:id/read', notifController.markAsRead);
router.patch('/read-all', notifController.markAllAsRead);

export default router;
