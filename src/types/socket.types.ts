import type { User } from './auth.types'
import type { TaskWithDetails } from './project.types'

// ============================================================
// CHANNEL & MESSAGE TYPES
// ============================================================

export type ChannelType = 'public' | 'private' | 'dm'

export interface Channel {
  id: string
  workspaceId: string
  projectId: string | null
  name: string
  description: string | null
  type: ChannelType
  createdBy: string
  createdAt: Date
}

export interface ChannelMember {
  channelId: string
  userId: string
  joinedAt: Date
  user: User
}

export interface ChannelWithDetails extends Channel {
  members: ChannelMember[]
  _count: {
    messages: number
  }
}

export interface Message {
  id: string
  channelId: string
  authorId: string
  parentId: string | null
  content: string | null
  isEdited: boolean
  isPinned: boolean
  createdAt: Date
  updatedAt: Date
  author: User
  reactions: Reaction[]
  attachments: Attachment[]
  replies?: Message[]
  replyCount?: number
}

export interface Reaction {
  id: string
  messageId: string
  userId: string
  emoji: string
  createdAt: Date
  user: User
}

export interface Attachment {
  id: string
  taskId: string | null
  messageId: string | null
  uploaderId: string
  filename: string
  fileUrl: string
  fileSize: number
  mimeType: string
  createdAt: Date
  uploader: User
}

// ============================================================
// PRESENCE & TYPING
// ============================================================

export interface PresenceUpdate {
  userId: string
  isOnline: boolean
  lastSeen: Date | null
}

export interface TypingUser {
  userId: string
  name: string
  avatarUrl: string | null
}

export interface TypingIndicator {
  taskId: string
  userId: string
  name: string
  isTyping: boolean
}

// ============================================================
// TASK REAL-TIME EVENTS
// ============================================================

export interface TaskMovedPayload {
  taskId: string
  columnId: string
  position: number
  status: string
  movedBy: string
}

export interface TaskDeletedPayload {
  taskId: string
  projectId: string
  deletedBy: string
}

export interface CommentCreatedPayload {
  taskId: string
  comment: {
    id: string
    taskId: string
    authorId: string
    parentId: string | null
    content: string
    createdAt: Date
    author: {
      id: string
      name: string
      email: string
      avatarUrl: string | null
    }
  }
}

export interface UserPresencePayload {
  userId: string
  name: string
}

// ============================================================
// SOCKET EVENT MAPS — used for typed Socket.io clients
// ============================================================

/** Events the SERVER sends to the CLIENT */
export interface ServerToClientEvents {
  // Task board events
  'task:created': (task: TaskWithDetails) => void
  'task:updated': (task: TaskWithDetails) => void
  'task:moved': (payload: TaskMovedPayload) => void
  'task:deleted': (payload: TaskDeletedPayload) => void
  // Comment events
  'comment:created': (payload: CommentCreatedPayload) => void
  'comment:typing': (payload: TypingIndicator) => void
  // Presence
  'user:online': (payload: UserPresencePayload) => void
  'user:offline': (payload: { userId: string }) => void
  'presence:update': (onlineUserIds: string[]) => void
  // Chat events
  'message:new': (message: Message) => void
  'message:reaction': (payload: { messageId: string; reactions: any[] }) => void
  'message:typing': (payload: { channelId: string; userId: string; name: string; isTyping: boolean }) => void
  // Notification events
  'notification:new': (notification: any) => void
}

/** Events the CLIENT sends to the SERVER */
export interface ClientToServerEvents {
  'project:join': (payload: { projectId: string }) => void
  'project:leave': (payload: { projectId: string }) => void
  'workspace:join': (payload: { workspaceId: string }) => void
  'workspace:leave': (payload: { workspaceId: string }) => void
  'channel:join': (payload: { channelId: string }) => void
  'channel:leave': (payload: { channelId: string }) => void
  'comment:typing': (payload: { taskId: string; projectId: string; isTyping: boolean }) => void
  'message:typing': (payload: { channelId: string; isTyping: boolean }) => void
}

/** Data stored on each socket (server-side) */
export interface SocketData {
  userId: string
  userName: string
  userEmail: string
}

// ============================================================
// SOCKET ROOMS
// ============================================================

export type SocketRoom =
  | `workspace:${string}`
  | `project:${string}`
  | `channel:${string}`
  | `task:${string}`
  | `user:${string}`
  | `dm:${string}:${string}`

// Notification payload (for Phase 8)
export interface NotificationPayload {
  id: string
  type: string
  title: string
  body: string | null
  actionUrl: string | null
  actorId: string | null
  actor?: User
  createdAt: Date
}
