import { apiFetch } from '@/services/auth.service'
import { ApiResponse } from '@/types/auth.types'
import { TaskWithDetails, Comment } from '@/types/project.types'
import {
  CreateTaskSchemaType,
  UpdateTaskSchemaType,
  MoveTaskSchemaType,
  CreateCommentSchemaType
} from '@/lib/validations'

export const TaskService = {
  /**
   * Create a new task inside a project column
   */
  async createTask(
    projectId: string,
    input: CreateTaskSchemaType
  ): Promise<ApiResponse<TaskWithDetails>> {
    return apiFetch<TaskWithDetails>(`/api/projects/${projectId}/tasks`, {
      method: 'POST',
      body: input as any
    })
  },

  /**
   * List all tasks for a project
   */
  async listTasks(projectId: string): Promise<ApiResponse<TaskWithDetails[]>> {
    return apiFetch<TaskWithDetails[]>(`/api/projects/${projectId}/tasks`, {
      method: 'GET'
    })
  },

  /**
   * Update task details (title, description, priority, assignees, dates, etc.)
   */
  async updateTask(
    taskId: string,
    input: UpdateTaskSchemaType
  ): Promise<ApiResponse<TaskWithDetails>> {
    return apiFetch<TaskWithDetails>(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      body: input as any
    })
  },

  /**
   * Move task to a new column or reorder within a column using fractional position
   */
  async moveTask(
    taskId: string,
    input: MoveTaskSchemaType
  ): Promise<ApiResponse<TaskWithDetails>> {
    return apiFetch<TaskWithDetails>(`/api/tasks/${taskId}/move`, {
      method: 'PATCH',
      body: input as any
    })
  },

  /**
   * Delete a task
   */
  async deleteTask(taskId: string): Promise<ApiResponse<null>> {
    return apiFetch<null>(`/api/tasks/${taskId}`, {
      method: 'DELETE'
    })
  },

  /**
   * List comments for a task (threaded)
   */
  async listComments(taskId: string): Promise<ApiResponse<Comment[]>> {
    return apiFetch<Comment[]>(`/api/tasks/${taskId}/comments`, {
      method: 'GET'
    })
  },

  /**
   * Create a comment on a task (supports threaded replies via parentId)
   */
  async createComment(
    taskId: string,
    input: CreateCommentSchemaType
  ): Promise<ApiResponse<Comment>> {
    return apiFetch<Comment>(`/api/tasks/${taskId}/comments`, {
      method: 'POST',
      body: input as any
    })
  }
}

export default TaskService
