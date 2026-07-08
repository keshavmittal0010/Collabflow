'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getSocket } from '@/lib/socket'
import { useTaskStore } from '@/store/task.store'
import type { TaskMovedPayload, TaskDeletedPayload, CommentCreatedPayload } from '@/types/socket.types'
import type { TaskWithDetails } from '@/types/project.types'

interface UseProjectSocketOptions {
  projectId: string
  enabled?: boolean
}

/**
 * useProjectSocket — subscribes to real-time task events for a specific project board.
 *
 * On mount:
 *   - Joins the `project:{projectId}` room
 *   - Listens for task:created, task:updated, task:moved, task:deleted, comment:created
 *   - Applies changes to the Zustand task store or invalidates TanStack Query cache
 *
 * On unmount:
 *   - Leaves the room
 *   - Removes all event listeners
 */
export function useProjectSocket({ projectId, enabled = true }: UseProjectSocketOptions) {
  const queryClient = useQueryClient()
  const { addTask, updateTask, optimisticMoveTask, removeTask } = useTaskStore()

  useEffect(() => {
    if (!enabled || !projectId) return

    let s: ReturnType<typeof getSocket>
    try {
      s = getSocket()
    } catch {
      return
    }

    const joinRoom = () => {
      s.emit('project:join', { projectId })
    }

    // Join room now if connected, or on connect
    if (s.connected) {
      joinRoom()
    }
    s.on('connect', joinRoom)

    // ── Task event handlers ─────────────────────────────────────────────────

    const onTaskCreated = (task: TaskWithDetails) => {
      // Only add if not already in store (avoid duplicating own creates)
      const { tasks } = useTaskStore.getState()
      if (!tasks.find((t) => t.id === task.id)) {
        addTask(task)
      }
    }

    const onTaskUpdated = (task: TaskWithDetails) => {
      updateTask(task)
    }

    const onTaskMoved = (payload: TaskMovedPayload) => {
      const { tasks } = useTaskStore.getState()
      const task = tasks.find((t) => t.id === payload.taskId)
      if (task) {
        optimisticMoveTask(
          payload.taskId,
          payload.columnId,
          payload.position,
          payload.status
        )
      }
    }

    const onTaskDeleted = (payload: TaskDeletedPayload) => {
      removeTask(payload.taskId)
    }

    const onCommentCreated = (payload: CommentCreatedPayload) => {
      // Invalidate the comments query so TaskDrawer refetches
      queryClient.invalidateQueries({ queryKey: ['comments', payload.taskId] })
      // Also invalidate the tasks list to update comment count badges
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
    }

    s.on('task:created', onTaskCreated)
    s.on('task:updated', onTaskUpdated)
    s.on('task:moved', onTaskMoved)
    s.on('task:deleted', onTaskDeleted)
    s.on('comment:created', onCommentCreated)

    return () => {
      // Leave room
      if (s.connected) {
        s.emit('project:leave', { projectId })
      }

      // Remove listeners
      s.off('connect', joinRoom)
      s.off('task:created', onTaskCreated)
      s.off('task:updated', onTaskUpdated)
      s.off('task:moved', onTaskMoved)
      s.off('task:deleted', onTaskDeleted)
      s.off('comment:created', onCommentCreated)
    }
  }, [projectId, enabled, addTask, updateTask, optimisticMoveTask, removeTask, queryClient])
}

export default useProjectSocket
