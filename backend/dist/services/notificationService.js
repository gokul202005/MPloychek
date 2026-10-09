"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const notificationRepository_1 = require("../repositories/xml/notificationRepository");
class NotificationService {
    notifRepo;
    constructor() {
        this.notifRepo = new notificationRepository_1.NotificationRepository();
    }
    async getNotifications(currentUser) {
        return this.notifRepo.getForUser(currentUser.id, currentUser.role, currentUser.organizationId);
    }
    async markAsRead(id, currentUser) {
        return this.notifRepo.markAsRead(id, currentUser.id, currentUser.role);
    }
    async markAllAsRead(currentUser) {
        return this.notifRepo.markAllAsRead(currentUser.id, currentUser.role, currentUser.organizationId);
    }
}
exports.NotificationService = NotificationService;
