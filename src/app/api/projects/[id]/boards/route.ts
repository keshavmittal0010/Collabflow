import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CreateBoardSchema } from '@/lib/validations'
import { apiSuccess, apiError } from '@/lib/utils'

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

    const project = await prisma.project.findUnique({
      where: { id: projectId }
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
      return apiError('FORBIDDEN', 'You do not have access to this project workspace', 403)
    }

    const body = await req.json()
    const result = CreateBoardSchema.safeParse(body)

    if (!result.success) {
      return apiError('VALIDATION_ERROR', result.error.issues[0].message, 400)
    }

    const { name, type } = result.data

    const board = await prisma.$transaction(async (tx) => {
      const b = await tx.board.create({
        data: {
          projectId,
          name,
          type: type || 'kanban',
          createdBy: userId
        }
      })

      // If it is a Kanban board, create default columns
      if (type === 'kanban' || !type) {
        const defaultColumns = [
          { name: 'Backlog', position: 0, isTerminal: false },
          { name: 'Todo', position: 1, isTerminal: false },
          { name: 'In Progress', position: 2, isTerminal: false },
          { name: 'Done', position: 3, isTerminal: true }
        ]

        await tx.boardColumn.createMany({
          data: defaultColumns.map((col) => ({
            boardId: b.id,
            name: col.name,
            position: col.position,
            isTerminal: col.isTerminal
          }))
        })
      }

      return b
    })

    return apiSuccess(board, 'Board created successfully', 201)
  } catch (error: any) {
    console.error('Create board error:', error)
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

    const project = await prisma.project.findUnique({
      where: { id: projectId }
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
      return apiError('FORBIDDEN', 'You do not have access to this project workspace', 403)
    }

    const boards = await prisma.board.findMany({
      where: { projectId },
      include: {
        columns: {
          orderBy: {
            position: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return apiSuccess(boards, 'Boards retrieved successfully')
  } catch (error: any) {
    console.error('List boards error:', error)
    return apiError('INTERNAL_SERVER_ERROR', error.message || 'Something went wrong', 500)
  }
}
