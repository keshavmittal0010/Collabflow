import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CreateColumnSchema } from '@/lib/validations'
import { apiSuccess, apiError } from '@/lib/utils'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: boardId } = await params
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
    const result = CreateColumnSchema.safeParse(body)

    if (!result.success) {
      return apiError('VALIDATION_ERROR', result.error.issues[0].message, 400)
    }

    const { name, color, position, isTerminal } = result.data

    // Calculate position if not provided
    let finalPosition = position
    if (finalPosition === undefined) {
      const maxCol = await prisma.boardColumn.findFirst({
        where: { boardId },
        orderBy: { position: 'desc' }
      })
      finalPosition = maxCol ? maxCol.position + 1 : 0
    }

    const column = await prisma.boardColumn.create({
      data: {
        boardId,
        name,
        color,
        position: finalPosition,
        isTerminal: isTerminal !== undefined ? isTerminal : false
      }
    })

    return apiSuccess(column, 'Column added successfully', 201)
  } catch (error: any) {
    console.error('Create column error:', error)
    return apiError('INTERNAL_SERVER_ERROR', error.message || 'Something went wrong', 500)
  }
}
