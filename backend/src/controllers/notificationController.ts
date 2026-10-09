import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notificationService';

export class NotificationController {
  private notifService: NotificationService;

  constructor() {
    this.notifService = new NotificationService();
  }

  getNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const notifications = await this.notifService.getNotifications(user);

      res.json({
        success: true,
        data: notifications
      });
    } catch (err) {
      next(err);
    }
  };

  markAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const updated = await this.notifService.markAsRead(req.params.id, user);

      if (!updated) {
        return res.status(404).json({ success: false, error: 'Notification not found' });
      }

      res.json({
        success: true,
        data: updated
      });
    } catch (err) {
      next(err);
    }
  };

  markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const count = await this.notifService.markAllAsRead(user);

      res.json({
        success: true,
        message: `Marked ${count} notifications as read`,
        updatedCount: count
      });
    } catch (err) {
      next(err);
    }
  };
}
