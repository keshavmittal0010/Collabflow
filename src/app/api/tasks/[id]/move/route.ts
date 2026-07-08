import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { MoveTaskSchema } from '@/lib/validations'
import { apiSuccess, apiError } from '@/lib/utils'
import { getIO } from '@/lib/io'

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

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: { select: { workspaceId: true } }
      }
    })

    if (!task) {
      return apiError('NOT_FOUND', 'Task not found', 404)
    }

    // Verify workspace membership
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: task.project.workspaceId,
          userId
        }
      }
    })

    if (!workspaceMember) {
      return apiError('FORBIDDEN', 'You do not have access to this workspace', 403)
    }

    const body = await req.json()
    const result = MoveTaskSchema.safeParse(body)

    if (!result.success) {
      return apiError('VALIDATION_ERROR', result.error.issues[0].message, 400)
    }

    const { columnId, position } = result.data

    // Verify the destination column belongs to the same project board
    const column = await prisma.boardColumn.findUnique({
      where: { id: columnId },
      include: { board: { select: { projectId: true } } }
    })

    if (!column || column.board.projectId !== task.projectId) {
      return apiError('BAD_REQUEST', 'Target column does not belong to this project', 400)
    }

    // Update the task position + column + status
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        columnId,
        status: column.name,
        position,
        completedAt: column.isTerminal ? new Date() : null
      },
      include: {
        assignees: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true }
            }
          }
        },
        _count: {
          select: { comments: true, attachments: true, subtasks: true }
        }
      }
    })

    // Broadcast task:moved to all project board viewers
    const io = getIO()
    if (io) {
      io.to(`project:${task.projectId}`).emit('task:moved', {
        taskId: id,
        columnId,
        position,
        status: column.name,
        movedBy: userId
      })
    }

    return apiSuccess(updatedTask, 'Task moved successfully')
  } catch (error: any) {
    console.error('Move task error:', error)
    return apiError('INTERNAL_SERVER_ERROR', error.message || 'Something went wrong', 500)
  }
}
