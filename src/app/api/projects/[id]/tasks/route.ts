import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CreateTaskSchema } from '@/lib/validations'
import { apiSuccess, apiError } from '@/lib/utils'
import { getIO } from '@/lib/io'
import { createNotification, scanAndNotifyMentions } from '@/lib/notification.helper'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return apiError('UNAUTHORIZED', 'Authentication required', 401)
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, identifier: true, workspaceId: true }
    })

    if (!project) {
      return apiError('NOT_FOUND', 'Project not found', 404)
    }

    // Verify workspace membership
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: project.workspaceId,
          userId
        }
      }
    })

    if (!workspaceMember) {
      return apiError('FORBIDDEN', 'You do not have access to this project', 403)
    }

    const body = await req.json()
    const result = CreateTaskSchema.safeParse(body)

    if (!result.success) {
      return apiError('VALIDATION_ERROR', result.error.issues[0].message, 400)
    }

    const { title, columnId, boardId, description, priority, assigneeIds, dueDate, startDate, estimate, parentId } = result.data

    // Verify column belongs to this project's board
    const column = await prisma.boardColumn.findUnique({
      where: { id: columnId },
      include: { board: { select: { projectId: true } } }
    })

    if (!column || column.board.projectId !== projectId) {
      return apiError('BAD_REQUEST', 'Column does not belong to this project', 400)
    }

    // Auto-calculate task identifier: count all tasks in project, +1 suffix
    const taskCount = await prisma.task.count({
      where: { projectId }
    })
    const identifier = `${project.identifier}-${taskCount + 1}`

    // Auto-calculate fractional position (max in column + 65536)
    const maxPositionTask = await prisma.task.findFirst({
      where: { columnId },
      orderBy: { position: 'desc' },
      select: { position: true }
    })
    const position = maxPositionTask
      ? Number(maxPositionTask.position) + 65536.0
      : 65536.0

    // Create task + assignees in a transaction
    const task = await prisma.$transaction(async (tx) => {
      const newTask = await tx.task.create({
        data: {
          projectId,
          boardId,
          columnId,
          parentId: parentId ?? null,
          title,
          description: description ?? null,
          identifier,
          status: column.name,
          priority: priority ?? 'medium',
          position,
          dueDate: dueDate ? new Date(dueDate) : null,
          startDate: startDate ? new Date(startDate) : null,
          estimate: estimate !== undefined && estimate !== null ? estimate : null,
          createdBy: userId
        }
      })

      // Create assignee rows
      if (assigneeIds && assigneeIds.length > 0) {
        await tx.taskAssignee.createMany({
          data: assigneeIds.map((uid) => ({
            taskId: newTask.id,
            userId: uid,
            assignedBy: userId
          })),
          skipDuplicates: true
        })
      }

      // Return task with full details
      return tx.task.findUnique({
        where: { id: newTask.id },
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

    // Broadcast to all project board viewers
    const io = getIO()
    if (io && task) {
      io.to(`project:${projectId}`).emit('task:created', task as any)
    }

    // Trigger assignment notifications
    if (assigneeIds && assigneeIds.length > 0 && task) {
      const actorName = req.headers.get('x-user-name') || 'Someone'
      for (const assigneeId of assigneeIds) {
        if (assigneeId === userId) continue // Skip notifying yourself
        await createNotification({
          userId: assigneeId,
          type: 'task_assigned',
          title: 'New Task Assigned',
          body: `${actorName} assigned you to task "${task.identifier}": ${task.title}`,
          actionUrl: `/workspace/${project.workspaceId}/project/${project.id}?task=${task.id}`,
          actorId: userId,
          entityType: 'task',
          entityId: task.id
        })
      }
    }

    // Scan mentions in title and description
    if (task) {
      const scanText = `${title} ${description || ''}`
      await scanAndNotifyMentions(scanText, userId, project.workspaceId, {
        type: 'task',
        id: task.id,
        title: task.title,
        actionUrl: `/workspace/${project.workspaceId}/project/${project.id}?task=${task.id}`
      })
    }

    return apiSuccess(task, 'Task created successfully', 201)
  } catch (error: any) {
    console.error('Create task error:', error)
    return apiError('INTERNAL_SERVER_ERROR', error.message || 'Something went wrong', 500)
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return apiError('UNAUTHORIZED', 'Authentication required', 401)
    }

    // Verify project + workspace membership
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, workspaceId: true }
    })

    if (!project) {
      return apiError('NOT_FOUND', 'Project not found', 404)
    }

    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: project.workspaceId,
          userId
        }
      }
    })

    if (!workspaceMember) {
      return apiError('FORBIDDEN', 'You do not have access to this project', 403)
    }

    const tasks = await prisma.task.findMany({
      where: { projectId, parentId: null },
      orderBy: [{ columnId: 'asc' }, { position: 'asc' }],
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
        labels: {
          include: {
            label: true
          }
        },
        _count: {
          select: { comments: true, attachments: true, subtasks: true }
        }
      }
    })

    return apiSuccess(tasks, 'Tasks retrieved successfully')
  } catch (error: any) {
    console.error('List tasks error:', error)
    return apiError('INTERNAL_SERVER_ERROR', error.message || 'Something went wrong', 500)
  }
}
