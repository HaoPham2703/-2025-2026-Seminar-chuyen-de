import { apiFetch } from './api';

export interface Notification {
  id: string;
  senderId: string;
  senderRole: string;
  type: 'ANNOUNCEMENT' | 'ATTENDANCE' | 'LEAVE' | 'SYSTEM' | 'URGENT';
  title: string;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  read: boolean;
  readAt: string | null;
  sentAt: string;
  metadata: {
    actionUrl: string | null;
    actionLabel: string | null;
    imageUrl: string | null;
  };
}

export interface NotificationListResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  unreadCount: number;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

/**
 * Lấy danh sách notifications
 */
export async function getNotifications(
  page: number = 1,
  limit: number = 20,
  unreadOnly: boolean | string = false
): Promise<NotificationListResponse> {
  const unreadOnlyParam = unreadOnly === true || unreadOnly === 'true' ? 'true' : 'false';
  const response = await apiFetch<NotificationListResponse>(
    `/notifications?page=${page}&limit=${limit}&unreadOnly=${unreadOnlyParam}`
  );
  return response.data!;
}

/**
 * Lấy số notifications chưa đọc
 */
export async function getUnreadCount(): Promise<number> {
  const response = await apiFetch<UnreadCountResponse>('/notifications/unread-count');
  return response.data!.unreadCount;
}

/**
 * Đánh dấu notification là đã đọc
 */
export async function markAsRead(notificationId: string): Promise<void> {
  await apiFetch(`/notifications/${notificationId}/read`, {
    method: 'PUT',
  });
}

/**
 * Đánh dấu tất cả notifications là đã đọc
 */
export async function markAllAsRead(): Promise<void> {
  await apiFetch('/notifications/read-all', {
    method: 'PUT',
  });
}

/**
 * Xóa notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  await apiFetch(`/notifications/${notificationId}`, {
    method: 'DELETE',
  });
}
