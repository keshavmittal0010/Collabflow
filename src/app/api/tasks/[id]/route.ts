import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UpdateTaskSchema } from '@/lib/validations'
import { apiSuccess, apiError } from '@/lib/utils'
import { getIO } from '@/lib/io'
import { createNotification, scanAndNotifyMentions } from '@/lib/notification.helper'

/**
 * Helper: verify task exists and user has workspace access.
 * Returns { task, workspaceMember } or null if not authorized.
 */
async function resolveTaskAccess(taskId: string, userId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: { select: { workspaceId: true } }
    }
  })

  if (!task) return null

  const workspaceMember = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: task.project.workspaceId,
        userId
      }
    }
  })

  if (!workspaceMember) return null

  return { task, workspaceMember }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return apiError('UNAUTHORIZED', 'Authentication required', 401)
    }

    const access = await resolveTaskAccess(id, userId)
    if (!access) {
      return apiError('FORBIDDEN', 'Access denied to this task', 403)
    }
    const { task } = access

    // Fetch previous assignees to diff
    const prevAssignees = await prisma.taskAssignee.findMany({
      where: { taskId: id },
      select: { userId: true }
    })
    const prevUserIds = prevAssignees.map((a) => a.userId)

    const body = await req.json()
    const result = UpdateTaskSchema.safeParse(body)

    if (!result.success) {
      return apiError('VALIDATION_ERROR', result.error.issues[0].message, 400)
    }

    const { title, description, priority, assigneeIds, dueDate, startDate, estimate, status } = result.data

    const updatedTask = await prisma.$transaction(async (tx) => {
      // Update the task fields
      await tx.task.update({
        where: { id },
        data: {
          title: title !== undefined ? title : undefined,
          description: description !== undefined ? description : undefined,
          priority: priority !== undefined ? priority : undefined,
          dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
          startDate: startDate !== undefined ? (startDate ? new Date(startDate) : null) : undefined,
          estimate: estimate !== undefined ? estimate : undefined,
          status: status !== undefined ? status : undefined
        }
      })

      // If assignees list is provided, diff and update
      if (assigneeIds !== undefined) {
        // Remove all existing assignees
        await tx.taskAssignee.deleteMany({ where: { taskId: id } })

        // Add new assignees
        if (assigneeIds.length > 0) {
          await tx.taskAssignee.createMany({
            data: assigneeIds.map((uid) => ({
              taskId: id,
              userId: uid,
              assignedBy: userId
            })),
            skipDuplicates: true
          })
        }
      }

      return tx.task.findUnique({
        where: { id },
        include: {
          assignees: {
            include: {
              user: {
                select: { id: true, name: true, email: true, avatarUrl: true }
              }
            }
          },
          creator: {
            select: { id: true, name: true, email: true, avatarUrl: true }
          },
          _count: {
            select: { comments: true, attachments: true, subtasks: true }
          }
        }
      })
    })

    // Broadcast task:updated to all project board viewers
    const io = getIO()
    if (io && updatedTask) {
      io.to(`project:${updatedTask.projectId}`).emit('task:updated', updatedTask as any)
    }

    // Trigger task assignment notifications
    if (assigneeIds !== undefined && updatedTask) {
      const actorName = req.headers.get('x-user-name') || 'Someone'
      const newUserIds = assigneeIds.filter((uid) => !prevUserIds.includes(uid))
      for (const newAssigneeId of newUserIds) {
        if (newAssigneeId === userId) continue // Skip notifying yourself
        await createNotification({
          userId: newAssigneeId,
          type: 'task_assigned',
          title: 'Assigned to Task',
          body: `${actorName} assigned you to task "${updatedTask.identifier}": ${updatedTask.title}`,
          actionUrl: `/workspace/${task.project.workspaceId}/project/${updatedTask.projectId}?task=${updatedTask.id}`,
          actorId: userId,
          entityType: 'task',
          entityId: updatedTask.id
        })
      }
    }

    // Scan mentions in task updates
    if (updatedTask && (title !== undefined || description !== undefined)) {
      const scanText = `${title || updatedTask.title} ${description !== undefined ? (description || '') : (updatedTask.description || '')}`
      await scanAndNotifyMentions(scanText, userId, task.project.workspaceId, {
        type: 'task',
        id: updatedTask.id,
        title: updatedTask.title,
        actionUrl: `/workspace/${task.project.workspaceId}/project/${updatedTask.projectId}?task=${updatedTask.id}`
      })
    }

    return apiSuccess(updatedTask, 'Task updated successfully')
  } catch (error: any) {
    console.error('Update task error:', error)
    return apiError('INTERNAL_SERVER_ERROR', error.message || 'Something went wrong', 500)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return apiError('UNAUTHORIZED', 'Authentication required', 401)
    }

    const access = await resolveTaskAccess(id, userId)
    if (!access) {
      return apiError('FORBIDDEN', 'Task not found or you do not have access', 403)
    }

    const { task } = access

    // Only task creator or project lead / workspace admin can delete
    const isCreator = task.createdBy === userId
    const isAdmin = access.workspaceMember.role === 'owner' || access.workspaceMember.role === 'admin'

    if (!isCreator && !isAdmin) {
      const projectMember = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: task.projectId,
            userId
          }
        }
      })
      if (projectMember?.role !== 'lead') {
        return apiError('FORBIDDEN', 'Only the task creator or project lead can delete this task', 403)
      }
    }

    await prisma.task.delete({ where: { id } })

    // Broadcast task:deleted to all project board viewers
    const io = getIO()
    if (io) {
      io.to(`project:${task.projectId}`).emit('task:deleted', {
        taskId: id,
        projectId: task.projectId,
        deletedBy: userId
      })
    }

    return apiSuccess(null, 'Task deleted successfully')
  } catch (error: any) {
    console.error('Delete task error:', error)
    return apiError('INTERNAL_SERVER_ERROR', error.message || 'Something went wrong', 500)
  }
}
