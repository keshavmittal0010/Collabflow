import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UpdateWorkspaceSchema } from '@/lib/validations'
import { apiSuccess, apiError } from '@/lib/utils'
import { WorkspaceRole } from '@/types/workspace.types'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return apiError('UNAUTHORIZED', 'Authentication required', 401)
    }

    // Check user's membership and role
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: id,
          userId
        }
      }
    })

    if (!membership) {
      return apiError('FORBIDDEN', 'You do not have access to this workspace', 403)
    }

    // Fetch workspace details
    const workspace = await prisma.workspace.findUnique({
      where: { id },
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
        projects: {
          select: {
            id: true,
            name: true,
            identifier: true,
            description: true,
            status: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        // Only include invites if user is owner or admin
        invites: membership.role === 'owner' || membership.role === 'admin'
          ? {
              orderBy: {
                createdAt: 'desc'
              }
            }
          : false
      }
    })

    if (!workspace) {
      return apiError('NOT_FOUND', 'Workspace not found', 404)
    }

    return apiSuccess(workspace, 'Workspace retrieved successfully')
  } catch (error: any) {
    console.error('Fetch workspace details error:', error)
    return apiError('INTERNAL_SERVER_ERROR', error.message || 'Something went wrong', 500)
  }
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

    // Verify membership and role (only owners or admins can edit settings)
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: id,
          userId
        }
      }
    })

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return apiError('FORBIDDEN', 'Only owners and admins can update settings', 403)
    }

    const body = await req.json()
    const result = UpdateWorkspaceSchema.safeParse(body)

    if (!result.success) {
      return apiError('VALIDATION_ERROR', result.error.issues[0].message, 400)
    }

    const { name, slug, description } = result.data

    // If slug is changing, verify uniqueness
    if (slug) {
      const existing = await prisma.workspace.findFirst({
        where: {
          slug,
          id: { not: id }
        }
      })
      if (existing) {
        return apiError('SLUG_TAKEN', 'This URL slug is already taken', 400)
      }
    }

    const updated = await prisma.workspace.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        slug: slug !== undefined ? slug : undefined,
        description: description !== undefined ? description : undefined
      }
    })

    return apiSuccess(updated, 'Workspace updated successfully')
  } catch (error: any) {
    console.error('Update workspace error:', error)
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

    // Verify that the user is the owner
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: id,
          userId
        }
      }
    })

    if (!membership || membership.role !== 'owner') {
      return apiError('FORBIDDEN', 'Only the owner can delete the workspace', 403)
    }

    // Delete workspace (cascade deletes memberships, projects, etc. via schema relations)
    await prisma.workspace.delete({
      where: { id }
    })

    return apiSuccess(null, 'Workspace deleted successfully')
  } catch (error: any) {
    console.error('Delete workspace error:', error)
    return apiError('INTERNAL_SERVER_ERROR', error.message || 'Something went wrong', 500)
  }
}
