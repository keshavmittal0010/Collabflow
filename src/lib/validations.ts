import { z } from 'zod'

export const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
})

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

export type RegisterSchemaType = z.infer<typeof RegisterSchema>
export type LoginSchemaType = z.infer<typeof LoginSchema>

export const CreateWorkspaceSchema = z.object({
  name: z.string().min(2, 'Workspace name must be at least 2 characters').max(100),
  slug: z.string().min(2, 'Slug must be at least 2 characters')
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase letters, numbers, and hyphens'),
  description: z.string().max(500).optional().nullable()
})

export const UpdateWorkspaceSchema = z.object({
  name: z.string().min(2, 'Workspace name must be at least 2 characters').max(100).optional(),
  slug: z.string().min(2, 'Slug must be at least 2 characters')
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase letters, numbers, and hyphens').optional(),
  description: z.string().max(500).optional().nullable()
})

export const InviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'member', 'viewer'], {
    message: 'Role must be admin, member, or viewer'
  })
})

export type CreateWorkspaceSchemaType = z.infer<typeof CreateWorkspaceSchema>
export type UpdateWorkspaceSchemaType = z.infer<typeof UpdateWorkspaceSchema>
export type InviteMemberSchemaType = z.infer<typeof InviteMemberSchema>

export const CreateProjectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters').max(100),
  identifier: z.string().min(2, 'Identifier must be at least 2 characters').max(10)
    .regex(/^[A-Z0-9]+$/, 'Identifier must contain only uppercase letters and numbers'),
  description: z.string().max(500).optional().nullable(),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'archived']).optional(),
  priority: z.enum(['critical', 'high', 'medium', 'low', 'none']).optional(),
  isPublic: z.boolean().optional()
})

export const UpdateProjectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters').max(100).optional(),
  identifier: z.string().min(2, 'Identifier must be at least 2 characters').max(10)
    .regex(/^[A-Z0-9]+$/, 'Identifier must contain only uppercase letters and numbers').optional(),
  description: z.string().max(500).optional().nullable(),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'archived']).optional(),
  priority: z.enum(['critical', 'high', 'medium', 'low', 'none']).optional(),
  isPublic: z.boolean().optional()
})

export const CreateBoardSchema = z.object({
  name: z.string().min(2, 'Board name must be at least 2 characters').max(100),
  type: z.enum(['kanban', 'list', 'calendar', 'timeline']).optional()
})

export const CreateColumnSchema = z.object({
  name: z.string().min(1, 'Column name must be at least 1 character').max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color').optional().nullable(),
  position: z.number().int().optional(),
  isTerminal: z.boolean().optional()
})

export type CreateProjectSchemaType = z.infer<typeof CreateProjectSchema>
export type UpdateProjectSchemaType = z.infer<typeof UpdateProjectSchema>
export type CreateBoardSchemaType = z.infer<typeof CreateBoardSchema>
export type CreateColumnSchemaType = z.infer<typeof CreateColumnSchema>

// ============================================================
// TASK SCHEMAS
// ============================================================

export const CreateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  columnId: z.string().min(1, 'Column is required'),
  boardId: z.string().min(1, 'Board is required'),
  description: z.string().optional().nullable(),
  priority: z.enum(['critical', 'high', 'medium', 'low', 'none']).optional(),
  assigneeIds: z.array(z.string()).optional(),
  dueDate: z.string().datetime({ offset: true }).optional().nullable(),
  startDate: z.string().datetime({ offset: true }).optional().nullable(),
  estimate: z.number().min(0).max(999999).optional().nullable(),
  parentId: z.string().optional().nullable()
})

export const UpdateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500).optional(),
  description: z.string().optional().nullable(),
  priority: z.enum(['critical', 'high', 'medium', 'low', 'none']).optional(),
  assigneeIds: z.array(z.string()).optional(),
  dueDate: z.string().datetime({ offset: true }).optional().nullable(),
  startDate: z.string().datetime({ offset: true }).optional().nullable(),
  estimate: z.number().min(0).max(999999).optional().nullable(),
  status: z.string().max(50).optional()
})

export const MoveTaskSchema = z.object({
  columnId: z.string().min(1, 'Column is required'),
  position: z.number()
})

export const CreateCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(10000),
  parentId: z.string().optional().nullable()
})

// ============================================================
// CHAT SCHEMAS
// ============================================================

export const CreateChannelSchema = z.object({
  name: z.string()
    .min(1, 'Channel name is required')
    .max(100, 'Name must be 100 characters or less')
    .regex(/^[a-z0-9-_]+$/, 'Channel name must contain only lowercase letters, numbers, hyphens, and underscores'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional().nullable(),
  type: z.enum(['public', 'private']),
  memberIds: z.array(z.string()).optional()
})

export const CreateMessageSchema = z.object({
  content: z.string().min(1, 'Message content cannot be empty').max(5000),
  parentId: z.string().optional().nullable()
})

export type CreateTaskSchemaType = z.infer<typeof CreateTaskSchema>
export type UpdateTaskSchemaType = z.infer<typeof UpdateTaskSchema>
export type MoveTaskSchemaType = z.infer<typeof MoveTaskSchema>
export type CreateCommentSchemaType = z.infer<typeof CreateCommentSchema>
export type CreateChannelSchemaType = z.infer<typeof CreateChannelSchema>
export type CreateMessageSchemaType = z.infer<typeof CreateMessageSchema>

// ============================================================
// PROFILE SCHEMAS
// ============================================================

export const UpdateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  bio: z.string().max(500).optional().nullable(),
  timezone: z.string().min(2, 'Timezone is required').max(100),
  theme: z.enum(['light', 'dark', 'system']),
  avatarUrl: z.string().url('Must be a valid URL').or(z.literal('')).optional().nullable()
})

export type UpdateProfileSchemaType = z.infer<typeof UpdateProfileSchema>

