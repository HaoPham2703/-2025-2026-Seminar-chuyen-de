import { api } from './api'

export interface Notification {
  _id: string
  type: 'ANNOUNCEMENT' | 'ATTENDANCE' | 'LEAVE' | 'SYSTEM' | 'URGENT'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  title: string
  message: string
  metadata?: any
  recipients: Array<{
    employeeId: string
    read: boolean
    readAt?: string
  }>
  createdAt: string
  updatedAt: string
}

export interface NotificationListResponse {
  notifications: Notification[]
  unreadCount: number
  total: number
}

export const notificationService = {
  async getAll(unreadOnly?: boolean): Promise<NotificationListResponse> {
    let url = '/notifications'
    if (unreadOnly !== undefined) {
      url += `?unreadOnly=${unreadOnly}`
    }
    const response = await api.get<NotificationListResponse>(url)
    return response.data || { notifications: [], unreadCount: 0, total: 0 }
  },

  async getById(notificationId: string): Promise<Notification> {
    const response = await api.get<Notification>(`/notifications/${notificationId}`)
    return response.data!
  },

  async markAsRead(notificationId: string): Promise<void> {
    await api.patch(`/notifications/${notificationId}/read`)
  },

  async markAllAsRead(): Promise<void> {
    await api.patch('/notifications/read-all')
  },

  async delete(notificationId: string): Promise<void> {
    await api.delete(`/notifications/${notificationId}`)
  },
}
