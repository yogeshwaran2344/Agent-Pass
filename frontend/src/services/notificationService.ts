import api from './api';
import { NotificationItem } from '../types';

export const notificationService = {
  async listNotifications(): Promise<NotificationItem[]> {
    const res = await api.get<NotificationItem[]>('/notifications/');
    return res.data;
  },

  async getUnreadCount(): Promise<number> {
    const res = await api.get<{ unread_count: number }>('/notifications/unread-count');
    return res.data.unread_count;
  },

  async markAsRead(notificationId: string): Promise<NotificationItem> {
    const res = await api.patch<NotificationItem>(`/notifications/${notificationId}/read`);
    return res.data;
  },

  async markAllRead(): Promise<void> {
    await api.post('/notifications/mark-all-read');
  },
};
