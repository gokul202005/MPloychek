"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationRepository = void 0;
const baseXmlRepository_1 = require("./baseXmlRepository");
class NotificationRepository extends baseXmlRepository_1.BaseXmlRepository {
    async getAll() {
        const data = await this.getFullData();
        return data.notifications;
    }
    async getById(id) {
        const data = await this.getFullData();
        return data.notifications.find(n => n.id === id) || null;
    }
    async getForUser(userId, role, orgId, includeRead = false) {
        const data = await this.getFullData();
        return data.notifications
            .filter(n => {
            if (n.organizationId !== orgId)
                return false;
            // Omit notifications that have been marked as read so they clear on browser refresh
            if (!includeRead && n.isRead)
                return false;
            if (n.recipientId === userId)
                return true;
            if (role === 'ADMIN' && n.recipientId === 'ALL_ADMINS')
                return true;
            return false;
        })
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    async clearReadNotifications(userId, role, orgId) {
        const data = await this.getFullData();
        const initialLen = data.notifications.length;
        data.notifications = data.notifications.filter(n => {
            if (n.organizationId === orgId &&
                (n.recipientId === userId || (role === 'ADMIN' && n.recipientId === 'ALL_ADMINS')) &&
                n.isRead) {
                return false;
            }
            return true;
        });
        const deletedCount = initialLen - data.notifications.length;
        if (deletedCount > 0) {
            await this.saveFullData(data, `Clear ${deletedCount} read notifications for user ${userId}`);
        }
        return deletedCount;
    }
    async create(notification) {
        const data = await this.getFullData();
        data.notifications.push(notification);
        await this.saveFullData(data, `Create Notification ${notification.id} for ${notification.recipientId}`);
        return notification;
    }
    async markAsRead(id, userId, role) {
        const data = await this.getFullData();
        const index = data.notifications.findIndex(n => n.id === id);
        if (index === -1)
            return null;
        const notif = data.notifications[index];
        if (notif.recipientId !== userId && !(role === 'ADMIN' && notif.recipientId === 'ALL_ADMINS')) {
            throw new Error('Unauthorized to modify this notification');
        }
        data.notifications[index].isRead = true;
        await this.saveFullData(data, `Mark Notification ${id} as read`);
        return data.notifications[index];
    }
    async markAllAsRead(userId, role, orgId) {
        const data = await this.getFullData();
        let updatedCount = 0;
        data.notifications = data.notifications.map(n => {
            if (n.organizationId === orgId &&
                (n.recipientId === userId || (role === 'ADMIN' && n.recipientId === 'ALL_ADMINS')) &&
                !n.isRead) {
                updatedCount++;
                return { ...n, isRead: true };
            }
            return n;
        });
        if (updatedCount > 0) {
            await this.saveFullData(data, `Mark all notifications as read for user ${userId}`);
        }
        return updatedCount;
    }
    async update(id, updates) {
        const data = await this.getFullData();
        const index = data.notifications.findIndex(n => n.id === id);
        if (index === -1)
            return null;
        data.notifications[index] = {
            ...data.notifications[index],
            ...updates
        };
        await this.saveFullData(data, `Update Notification ${id}`);
        return data.notifications[index];
    }
    async delete(id) {
        const data = await this.getFullData();
        const initialLen = data.notifications.length;
        data.notifications = data.notifications.filter(n => n.id !== id);
        if (data.notifications.length !== initialLen) {
            await this.saveFullData(data, `Delete Notification ${id}`);
            return true;
        }
        return false;
    }
}
exports.NotificationRepository = NotificationRepository;
