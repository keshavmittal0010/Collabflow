import { apiFetch } from '@/services/auth.service'
import { ApiResponse } from '@/types/auth.types'
import { Workspace, WorkspaceWithMembers, WorkspaceInvite } from '@/types/workspace.types'
import { CreateWorkspaceSchemaType, UpdateWorkspaceSchemaType, InviteMemberSchemaType } from '@/lib/validations'

export const WorkspaceService = {
  /**
   * Create a new workspace
   */
  async createWorkspace(input: CreateWorkspaceSchemaType): Promise<ApiResponse<Workspace>> {
    return apiFetch<Workspace>('/api/workspaces', {
      method: 'POST',
      body: input as any
    })
  },

  /**
   * List workspaces where the current user is a member
   */
  async listWorkspaces(): Promise<ApiResponse<WorkspaceWithMembers[]>> {
    return apiFetch<WorkspaceWithMembers[]>('/api/workspaces', {
      method: 'GET'
    })
  },

  /**
   * Fetch specific workspace details (members, projects, counts)
   */
  async getWorkspace(id: string): Promise<ApiResponse<WorkspaceWithMembers & { projects: any[]; invites?: WorkspaceInvite[] }>> {
    return apiFetch<any>(`/api/workspaces/${id}`, {
      method: 'GET'
    })
  },

  /**
   * Update workspace details (name, slug, description)
   */
  async updateWorkspace(id: string, input: UpdateWorkspaceSchemaType): Promise<ApiResponse<Workspace>> {
    return apiFetch<Workspace>(`/api/workspaces/${id}`, {
      method: 'PATCH',
      body: input as any
    })
  },

  /**
   * Delete a workspace (restricted to owner)
   */
  async deleteWorkspace(id: string): Promise<ApiResponse<null>> {
    return apiFetch<null>(`/api/workspaces/${id}`, {
      method: 'DELETE'
    })
  },

  /**
   * Invite a new member to a workspace
   */
  async inviteMember(id: string, input: InviteMemberSchemaType): Promise<ApiResponse<WorkspaceInvite>> {
    return apiFetch<WorkspaceInvite>(`/api/workspaces/${id}/invite`, {
      method: 'POST',
      body: input as any
    })
  },

  /**
   * Verify workspace invite token details
   */
  async verifyInvite(token: string): Promise<ApiResponse<{ id: string; email: string; role: string; workspace: any; sender: any }>> {
    return apiFetch<any>(`/api/workspaces/invite/${token}`, {
      method: 'GET'
    })
  },

  /**
   * Accept workspace invitation
   */
  async acceptInvite(token: string): Promise<ApiResponse<{ workspaceId: string }>> {
    return apiFetch<{ workspaceId: string }>(`/api/workspaces/invite/${token}`, {
      method: 'POST'
    })
  },

  /**
   * Update member role
   */
  async updateMemberRole(workspaceId: string, memberId: string, role: string): Promise<ApiResponse<any>> {
    return apiFetch<any>(`/api/workspaces/${workspaceId}/members/${memberId}`, {
      method: 'PATCH',
      body: { role } as any
    })
  },

  /**
   * Remove member from workspace
   */
  async removeMember(workspaceId: string, memberId: string): Promise<ApiResponse<null>> {
    return apiFetch<null>(`/api/workspaces/${workspaceId}/members/${memberId}`, {
      method: 'DELETE'
    })
  }
}

export default WorkspaceService
