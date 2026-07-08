import type { User } from './auth.types'

// ============================================================
// WORKSPACE TYPES
// ============================================================

export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer'
export type WorkspacePlan = 'free' | 'pro' | 'enterprise'

export interface Workspace {
  id: string
  name: string
  slug: string
  description: string | null
  logoUrl: string | null
  ownerId: string
  plan: WorkspacePlan
  createdAt: Date
  updatedAt: Date
}

export interface WorkspaceMember {
  id: string
  workspaceId: string
  userId: string
  role: WorkspaceRole
  joinedAt: Date
  user: User
}

export interface WorkspaceWithMembers extends Workspace {
  members: WorkspaceMember[]
  _count: {
    members: number
    projects: number
  }
}

export interface WorkspaceInvite {
  id: string
  workspaceId: string
  email: string
  role: WorkspaceRole
  token: string
  invitedBy: string
  expiresAt: Date
  acceptedAt: Date | null
  createdAt: Date
}

// ============================================================
// TEAM TYPES
// ============================================================

export type TeamRole = 'lead' | 'member'

export interface Team {
  id: string
  workspaceId: string
  name: string
  description: string | null
  color: string | null
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface TeamMember {
  id: string
  teamId: string
  userId: string
  role: TeamRole
  joinedAt: Date
  user: User
}

export interface TeamWithMembers extends Team {
  members: TeamMember[]
}
