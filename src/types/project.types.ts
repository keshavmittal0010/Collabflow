import type { User } from './auth.types'

// ============================================================
// PROJECT TYPES
// ============================================================

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'archived'
export type Priority = 'critical' | 'high' | 'medium' | 'low' | 'none'
export type BoardType = 'kanban' | 'list' | 'calendar' | 'timeline'
export type ProjectRole = 'lead' | 'member' | 'viewer'

export interface Project {
  id: string
  workspaceId: string
  teamId: string | null
  name: string
  description: string | null
  identifier: string
  status: ProjectStatus
  priority: Priority
  leadId: string | null
  startDate: Date | null
  endDate: Date | null
  logoUrl: string | null
  isPublic: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface ProjectMember {
  id: string
  projectId: string
  userId: string
  role: ProjectRole
  joinedAt: Date
  user: User
}

export interface ProjectWithDetails extends Project {
  lead: User | null
  members: ProjectMember[]
  boards: (Board & { columns: BoardColumn[] })[]
  _count: {
    tasks: number
    members: number
  }
}

// ============================================================
// BOARD TYPES
// ============================================================

export interface Board {
  id: string
  projectId: string
  name: string
  type: BoardType
  createdBy: string
  createdAt: Date
}

export interface BoardColumn {
  id: string
  boardId: string
  name: string
  color: string | null
  position: number
  isTerminal: boolean
  createdAt: Date
}

export interface BoardWithColumns extends Board {
  columns: BoardColumnWithTasks[]
}

export interface BoardColumnWithTasks extends BoardColumn {
  tasks: Task[]
}

// ============================================================
// TASK TYPES
// ============================================================

export interface Task {
  id: string
  projectId: string
  boardId: string | null
  columnId: string | null
  parentId: string | null
  title: string
  description: string | null
  identifier: string
  status: string
  priority: Priority
  position: number
  dueDate: Date | null
  startDate: Date | null
  estimate: number | null
  createdBy: string
  createdAt: Date
  updatedAt: Date
  completedAt: Date | null
}

export interface TaskAssignee {
  taskId: string
  userId: string
  assignedAt: Date
  assignedBy: string | null
  user: User
}

export interface Label {
  id: string
  workspaceId: string
  name: string
  color: string
  createdAt: Date
}

export interface TaskWithDetails extends Task {
  assignees: TaskAssignee[]
  labels: Label[]
  subtasks: Task[]
  creator: User
  _count: {
    comments: number
    attachments: number
    subtasks: number
  }
}

// ============================================================
// COMMENT TYPES
// ============================================================

export interface Comment {
  id: string
  taskId: string
  authorId: string
  parentId: string | null
  content: string
  isEdited: boolean
  createdAt: Date
  updatedAt: Date
  author: User
  replies?: Comment[]
}
