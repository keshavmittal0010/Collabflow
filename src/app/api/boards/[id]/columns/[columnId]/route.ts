import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/utils'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; columnId: string }> }
) {
  try {
    const { id: boardId, columnId } = await params
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return apiError('UNAUTHORIZED', 'Authentication required', 401)
    }

    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        project: {
          select: {
            workspaceId: true
          }
        }
      }
    })

    if (!board) {
      return apiError('NOT_FOUND', 'Board not found', 404)
    }

    // Verify workspace membership
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: board.project.workspaceId,
          userId
        }
      }
    })

    if (!workspaceMember) {
      return apiError('FORBIDDEN', 'You do not have access to this board workspace', 403)
    }

    const body = await req.json()
    const { name, color, position, isTerminal } = body

    const updated = await prisma.boardColumn.update({
      where: { id: columnId },
      data: {
        name: name !== undefined ? name : undefined,
        color: color !== undefined ? color : undefined,
        position: position !== undefined ? position : undefined,
        isTerminal: isTerminal !== undefined ? isTerminal : undefined
      }
    })

    return apiSuccess(updated, 'Column updated successfully')
  } catch (error: any) {
    console.error('Update column error:', error)
    return apiError('INTERNAL_SERVER_ERROR', error.message || 'Something went wrong', 500)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; columnId: string }> }
) {
  try {
    const { id: boardId, columnId } = await params
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return apiError('UNAUTHORIZED', 'Authentication required', 401)
    }

    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        project: {
          select: {
            workspaceId: true
          }
        }
      }
    })

    if (!board) {
      return apiError('NOT_FOUND', 'Board not found', 404)
    }

    // Verify workspace membership
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: board.project.workspaceId,
          userId
        }
      }
    })

    if (!workspaceMember) {
      return apiError('FORBIDDEN', 'You do not have access to this board workspace', 403)
    }

    // Delete column
    await prisma.boardColumn.delete({
      where: { id: columnId }
    })

    return apiSuccess(null, 'Column deleted successfully')
  } catch (error: any) {
    console.error('Delete column error:', error)
    return apiError('INTERNAL_SERVER_ERROR', error.message || 'Something went wrong', 500)
  }
}
