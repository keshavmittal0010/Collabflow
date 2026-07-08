import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CreateWorkspaceSchema } from '@/lib/validations'
import { apiSuccess, apiError } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return apiError('UNAUTHORIZED', 'Authentication required', 401)
    }

    const body = await req.json()
    const result = CreateWorkspaceSchema.safeParse(body)

    if (!result.success) {
      return apiError('VALIDATION_ERROR', result.error.issues[0].message, 400)
    }

    const { name, slug, description } = result.data

    // Check slug uniqueness
    const existing = await prisma.workspace.findUnique({
      where: { slug }
    })

    if (existing) {
      return apiError('SLUG_TAKEN', 'This URL slug is already taken', 400)
    }

    // Create workspace and workspace membership in a transaction
    const workspace = await prisma.$transaction(async (tx) => {
      const ws = await tx.workspace.create({
        data: {
          name,
          slug,
          description,
          ownerId: userId,
          plan: 'free'
        }
      })

      await tx.workspaceMember.create({
        data: {
          workspaceId: ws.id,
          userId,
          role: 'owner'
        }
      })

      return ws
    })

    return apiSuccess(workspace, 'Workspace created successfully', 201)
  } catch (error: any) {
    console.error('Create workspace error:', error)
    return apiError('INTERNAL_SERVER_ERROR', error.message || 'Something went wrong', 500)
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return apiError('UNAUTHORIZED', 'Authentication required', 401)
    }

    // Find all workspaces where user is a member
    const workspaces = await prisma.workspace.findMany({
      where: {
        members: {
          some: { userId }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                avatarUrl: true
              }
            }
          }
        },
        _count: {
          select: {
            members: true,
            projects: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return apiSuccess(workspaces, 'Workspaces retrieved successfully')
  } catch (error: any) {
    console.error('List workspaces error:', error)
    return apiError('INTERNAL_SERVER_ERROR', error.message || 'Something went wrong', 500)
  }
}
