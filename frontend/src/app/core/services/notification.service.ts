import { Injectable, signal } from '@angular/core';
import { tap } from 'rxjs';
import { ApiService } from './api.service';
import { Notification } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  notifications = signal<Notification[]>([]);
  unreadCount = signal<number>(0);

  constructor(private api: ApiService) {}

  fetchNotifications() {
    return this.api.get<Notification[]>('/notifications').pipe(
      tap(res => {
        if (res.data) {
          this.notifications.set(res.data);
          this.unreadCount.set(res.data.filter(n => !n.isRead).length);
        }
      })
    );
  }

  markAsRead(id: string) {
    return this.api.patch<Notification>(`/notifications/${id}/read`, {}).pipe(
      tap(res => {
        if (res.data) {
          this.notifications.update(list =>
            list.map(n => (n.id === id ? { ...n, isRead: true } : n))
          );
          this.unreadCount.update(c => Math.max(0, c - 1));
        }
      })
    );
  }

  markAllAsRead() {
    return this.api.patch<{ message: string; updatedCount: number }>('/notifications/read-all', {}).pipe(
      tap(() => {
        this.notifications.update(list => list.map(n => ({ ...n, isRead: true })));
        this.unreadCount.set(0);
      })
    );
  }
}
