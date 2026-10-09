"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const notificationService_1 = require("../services/notificationService");
class NotificationController {
    notifService;
    constructor() {
        this.notifService = new notificationService_1.NotificationService();
    }
    getNotifications = async (req, res, next) => {
        try {
            const user = req.user;
            const includeRead = req.query.includeRead === 'true';
            const notifications = await this.notifService.getNotifications(user, includeRead);
            res.json({
                success: true,
                data: notifications
            });
        }
        catch (err) {
            next(err);
        }
    };
    markAsRead = async (req, res, next) => {
        try {
            const user = req.user;
            const updated = await this.notifService.markAsRead(req.params.id, user);
            if (!updated) {
                return res.status(404).json({ success: false, error: 'Notification not found' });
            }
            res.json({
                success: true,
                data: updated
            });
        }
        catch (err) {
            next(err);
        }
    };
    markAllAsRead = async (req, res, next) => {
        try {
            const user = req.user;
            const count = await this.notifService.markAllAsRead(user);
            res.json({
                success: true,
                message: `Marked ${count} notifications as read`,
                updatedCount: count
            });
        }
        catch (err) {
            next(err);
        }
    };
    clearRead = async (req, res, next) => {
        try {
            const user = req.user;
            const count = await this.notifService.clearRead(user);
            res.json({
                success: true,
                message: `Cleared ${count} read notifications`,
                clearedCount: count
            });
        }
        catch (err) {
            next(err);
        }
    };
}
exports.NotificationController = NotificationController;
