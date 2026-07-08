import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CreateProjectSchema } from '@/lib/validations'
import { apiSuccess, apiError } from '@/lib/utils'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workspaceId } = await params
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return apiError('UNAUTHORIZED', 'Authentication required', 401)
    }

    // Check workspace membership
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId
        }
      }
    })

    if (!membership) {
      return apiError('FORBIDDEN', 'You do not have access to this workspace', 403)
    }

    const body = await req.json()
    const result = CreateProjectSchema.safeParse(body)

    if (!result.success) {
      return apiError('VALIDATION_ERROR', result.error.issues[0].message, 400)
    }

    const { name, identifier, description, status, priority, isPublic } = result.data

    // Check identifier uniqueness in the workspace
    const existing = await prisma.project.findUnique({
      where: {
        workspaceId_identifier: {
          workspaceId,
          identifier
        }
      }
    })

    if (existing) {
      return apiError('IDENTIFIER_TAKEN', 'A project with this identifier already exists in this workspace', 400)
    }

    // Create project, member entry, board, and columns in a single transaction
    const project = await prisma.$transaction(async (tx) => {
      const proj = await tx.project.create({
        data: {
          workspaceId,
          name,
          identifier,
          description,
          status: status || 'planning',
          priority: priority || 'medium',
          isPublic: isPublic !== undefined ? isPublic : false,
          createdBy: userId,
          leadId: userId
        }
      })

      // Add user as Project Member (lead role)
      await tx.projectMember.create({
        data: {
          projectId: proj.id,
          userId,
          role: 'lead'
        }
      })

      // Create default Kanban board
      const board = await tx.board.create({
        data: {
          projectId: proj.id,
          name: 'Kanban',
          type: 'kanban',
          createdBy: userId
        }
      })

      // Create default columns on the board
      const defaultColumns = [
        { name: 'Backlog', position: 0, isTerminal: false },
        { name: 'Todo', position: 1, isTerminal: false },
        { name: 'In Progress', position: 2, isTerminal: false },
        { name: 'Done', position: 3, isTerminal: true }
      ]

      await tx.boardColumn.createMany({
        data: defaultColumns.map((col) => ({
          boardId: board.id,
          name: col.name,
          position: col.position,
          isTerminal: col.isTerminal
        }))
      })

      return proj
    })

    return apiSuccess(project, 'Project and default Kanban board created successfully', 201)
  } catch (error: any) {
    console.error('Create project error:', error)
    return apiError('INTERNAL_SERVER_ERROR', error.message || 'Something went wrong', 500)
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workspaceId } = await params
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return apiError('UNAUTHORIZED', 'Authentication required', 401)
    }

    // Check workspace membership
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId
        }
      }
    })

    if (!membership) {
      return apiError('FORBIDDEN', 'You do not have access to this workspace', 403)
    }

    const projects = await prisma.project.findMany({
      where: {
        workspaceId
      },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        },
        _count: {
          select: {
            members: true,
            tasks: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return apiSuccess(projects, 'Projects retrieved successfully')
  } catch (error: any) {
    console.error('List projects error:', error)
    return apiError('INTERNAL_SERVER_ERROR', error.message || 'Something went wrong', 500)
  }
}
