import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CreateCommentSchema } from '@/lib/validations'
import { apiSuccess, apiError } from '@/lib/utils'
import { getIO } from '@/lib/io'
import { createNotification, scanAndNotifyMentions } from '@/lib/notification.helper'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return apiError('UNAUTHORIZED', 'Authentication required', 401)
    }

    // Verify task exists and user has access
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: { select: { workspaceId: true } } }
    })

    if (!task) {
      return apiError('NOT_FOUND', 'Task not found', 404)
    }

    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: task.project.workspaceId,
          userId
        }
      }
    })

    if (!workspaceMember) {
      return apiError('FORBIDDEN', 'You do not have access to this task', 403)
    }

    // Fetch top-level comments with their replies
    const comments = await prisma.comment.findMany({
      where: { taskId, parentId: null },
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          select: { id: true, name: true, email: true, avatarUrl: true }
        },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: { id: true, name: true, email: true, avatarUrl: true }
            }
          }
        }
      }
    })

    return apiSuccess(comments, 'Comments retrieved successfully')
  } catch (error: any) {
    console.error('List comments error:', error)
    return apiError('INTERNAL_SERVER_ERROR', error.message || 'Something went wrong', 500)
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return apiError('UNAUTHORIZED', 'Authentication required', 401)
    }

    // Verify task exists and user has access
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: { select: { workspaceId: true } },
        assignees: { select: { userId: true } }
      }
    })

    if (!task) {
      return apiError('NOT_FOUND', 'Task not found', 404)
    }

    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: task.project.workspaceId,
          userId
        }
      }
    })

    if (!workspaceMember) {
      return apiError('FORBIDDEN', 'You do not have access to this task', 403)
    }

    const body = await req.json()
    const result = CreateCommentSchema.safeParse(body)

    if (!result.success) {
      return apiError('VALIDATION_ERROR', result.error.issues[0].message, 400)
    }

    const { content, parentId } = result.data

    // If parentId is provided, verify it belongs to this task
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId }
      })
      if (!parentComment || parentComment.taskId !== taskId) {
        return apiError('BAD_REQUEST', 'Parent comment does not belong to this task', 400)
      }
    }

    const comment = await prisma.comment.create({
      data: {
        taskId,
        authorId: userId,
        parentId: parentId ?? null,
        content
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, avatarUrl: true }
        },
        replies: {
          include: {
            author: {
              select: { id: true, name: true, email: true, avatarUrl: true }
            }
          }
        }
      }
    })

    // Broadcast comment:created to all project board viewers
    const io = getIO()
    if (io) {
      io.to(`project:${task.projectId}`).emit('comment:created', {
        taskId,
        comment: {
          id: comment.id,
          taskId: comment.taskId,
          authorId: comment.authorId,
          parentId: comment.parentId,
          content: comment.content,
          createdAt: comment.createdAt,
          author: comment.author
        } as any
      })
    }

    // Trigger comment added notifications to task creator + assignees
    const recipients = new Set<string>()
    if (task.createdBy !== userId) recipients.add(task.createdBy)
    task.assignees.forEach((a) => {
      if (a.userId !== userId) recipients.add(a.userId)
    })

    const actorName = req.headers.get('x-user-name') || 'Someone'
    for (const recipientId of recipients) {
      await createNotification({
        userId: recipientId,
        type: 'comment_added',
        title: 'New Comment on Task',
        body: `${actorName} commented on "${task.title}": "${content.substring(0, 80)}${content.length > 80 ? '...' : ''}"`,
        actionUrl: `/workspace/${task.project.workspaceId}/project/${task.projectId}?task=${task.id}`,
        actorId: userId,
        entityType: 'comment',
        entityId: comment.id
      })
    }

    // Scan mentions in comment content
    await scanAndNotifyMentions(content, userId, task.project.workspaceId, {
      type: 'comment',
      id: comment.id,
      title: task.title,
      actionUrl: `/workspace/${task.project.workspaceId}/project/${task.projectId}?task=${task.id}`
    })

    return apiSuccess(comment, 'Comment created successfully', 201)
  } catch (error: any) {
    console.error('Create comment error:', error)
    return apiError('INTERNAL_SERVER_ERROR', error.message || 'Something went wrong', 500)
  }
}
