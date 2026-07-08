import { apiFetch } from '@/services/auth.service'
import { ApiResponse } from '@/types/auth.types'
import { Project, ProjectWithDetails, Board, BoardColumn } from '@/types/project.types'
import { CreateProjectSchemaType, UpdateProjectSchemaType, CreateBoardSchemaType, CreateColumnSchemaType } from '@/lib/validations'

export const ProjectService = {
  /**
   * Create a new project within a workspace
   */
  async createProject(workspaceId: string, input: CreateProjectSchemaType): Promise<ApiResponse<Project>> {
    return apiFetch<Project>(`/api/workspaces/${workspaceId}/projects`, {
      method: 'POST',
      body: input as any
    })
  },

  /**
   * List projects in a workspace
   */
  async listProjects(workspaceId: string): Promise<ApiResponse<Project[]>> {
    return apiFetch<Project[]>(`/api/workspaces/${workspaceId}/projects`, {
      method: 'GET'
    })
  },

  /**
   * Fetch specific project details (boards, members list)
   */
  async getProject(projectId: string): Promise<ApiResponse<ProjectWithDetails>> {
    return apiFetch<ProjectWithDetails>(`/api/projects/${projectId}`, {
      method: 'GET'
    })
  },

  /**
   * Update project details
   */
  async updateProject(projectId: string, input: UpdateProjectSchemaType): Promise<ApiResponse<Project>> {
    return apiFetch<Project>(`/api/projects/${projectId}`, {
      method: 'PATCH',
      body: input as any
    })
  },

  /**
   * Delete a project
   */
  async deleteProject(projectId: string): Promise<ApiResponse<null>> {
    return apiFetch<null>(`/api/projects/${projectId}`, {
      method: 'DELETE'
    })
  },

  /**
   * Create a new board in a project
   */
  async createBoard(projectId: string, input: CreateBoardSchemaType): Promise<ApiResponse<Board>> {
    return apiFetch<Board>(`/api/projects/${projectId}/boards`, {
      method: 'POST',
      body: input as any
    })
  },

  /**
   * List boards inside a project
   */
  async listBoards(projectId: string): Promise<ApiResponse<Board[]>> {
    return apiFetch<Board[]>(`/api/projects/${projectId}/boards`, {
      method: 'GET'
    })
  },

  /**
   * Create a board column
   */
  async createColumn(boardId: string, input: CreateColumnSchemaType): Promise<ApiResponse<BoardColumn>> {
    return apiFetch<BoardColumn>(`/api/boards/${boardId}/columns`, {
      method: 'POST',
      body: input as any
    })
  },

  /**
   * Update board column settings (rename, change color, position)
   */
  async updateColumn(boardId: string, columnId: string, input: Partial<CreateColumnSchemaType>): Promise<ApiResponse<BoardColumn>> {
    return apiFetch<BoardColumn>(`/api/boards/${boardId}/columns/${columnId}`, {
      method: 'PATCH',
      body: input as any
    })
  },

  /**
   * Delete a column from a board
   */
  async deleteColumn(boardId: string, columnId: string): Promise<ApiResponse<null>> {
    return apiFetch<null>(`/api/boards/${boardId}/columns/${columnId}`, {
      method: 'DELETE'
    })
  }
}

export default ProjectService
