import { apiFetch } from '@/services/auth.service'
import { ApiResponse } from '@/types/auth.types'

export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  body: string | null
  actionUrl: string | null
  actorId: string | null
  entityType: string | null
  entityId: string | null
  isRead: boolean
  createdAt: string
  actor?: {
    id: string
    name: string
    avatarUrl: string | null
  }
}

export interface ListNotificationsResponse {
  notifications: Notification[]
  unreadCount: number
}

export const NotificationService = {
  /**
   * List notifications for the current user
   */
  async listNotifications(
    limit = 20,
    offset = 0
  ): Promise<ApiResponse<ListNotificationsResponse>> {
    return apiFetch<ListNotificationsResponse>(
      `/api/notifications?limit=${limit}&offset=${offset}`,
      { method: 'GET' }
    )
  },

  /**
   * Mark a notification as read or unread
   */
  async markRead(id: string, isRead = true): Promise<ApiResponse<Notification>> {
    return apiFetch<Notification>(`/api/notifications/${id}/read`, {
      method: 'PATCH',
      body: { isRead } as any
    })
  },

  /**
   * Mark all notifications as read, optionally filtered by workspaceId
   */
  async markAllRead(workspaceId?: string): Promise<ApiResponse<null>> {
    const url = workspaceId
      ? `/api/notifications/read-all?workspaceId=${workspaceId}`
      : '/api/notifications/read-all'
    return apiFetch<null>(url, {
      method: 'PATCH'
    })
  }
}

export default NotificationService
