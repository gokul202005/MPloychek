import { NotificationRepository } from '../repositories/xml/notificationRepository';
import { SafeUser } from '../types';

export class NotificationService {
  private notifRepo: NotificationRepository;

  constructor() {
    this.notifRepo = new NotificationRepository();
  }

  async getNotifications(currentUser: SafeUser, includeRead = false) {
    return this.notifRepo.getForUser(currentUser.id, currentUser.role, currentUser.organizationId, includeRead);
  }

  async markAsRead(id: string, currentUser: SafeUser) {
    return this.notifRepo.markAsRead(id, currentUser.id, currentUser.role);
  }

  async markAllAsRead(currentUser: SafeUser) {
    return this.notifRepo.markAllAsRead(currentUser.id, currentUser.role, currentUser.organizationId);
  }

  async clearRead(currentUser: SafeUser) {
    return this.notifRepo.clearReadNotifications(currentUser.id, currentUser.role, currentUser.organizationId);
  }
}
