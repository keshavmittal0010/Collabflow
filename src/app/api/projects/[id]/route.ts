import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UpdateProjectSchema } from '@/lib/validations'
import { apiSuccess, apiError } from '@/lib/utils'

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

    // Fetch project metadata first to check workspace membership
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        workspace: {
          select: {
            id: true
          }
        }
      }
    })

    if (!project) {
      return apiError('NOT_FOUND', 'Project not found', 404)
    }

    // Verify workspace membership
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: project.workspace.id,
          userId
        }
      }
    })

    if (!workspaceMember) {
      return apiError('FORBIDDEN', 'You do not have access to this workspace project', 403)
    }

    // Retrieve detailed project, boards, and members
    const projectDetails = await prisma.project.findUnique({
      where: { id },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true
              }
            }
          }
        },
        boards: {
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
        }
      }
    })

    return apiSuccess(projectDetails, 'Project details retrieved successfully')
  } catch (error: any) {
    console.error('Fetch project details error:', error)
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

    const project = await prisma.project.findUnique({
      where: { id }
    })

    if (!project) {
      return apiError('NOT_FOUND', 'Project not found', 404)
    }

    // Retrieve requester's workspace role and project role
    const [workspaceMember, projectMember] = await Promise.all([
      prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: project.workspaceId,
            userId
          }
        }
      }),
      prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: id,
            userId
          }
        }
      })
    ])

    const isWorkspaceAdminOrOwner = workspaceMember?.role === 'owner' || workspaceMember?.role === 'admin'
    const isProjectLead = projectMember?.role === 'lead'

    if (!isWorkspaceAdminOrOwner && !isProjectLead) {
      return apiError('FORBIDDEN', 'Only project leads and workspace admins can update this project', 403)
    }

    const body = await req.json()
    const result = UpdateProjectSchema.safeParse(body)

    if (!result.success) {
      return apiError('VALIDATION_ERROR', result.error.issues[0].message, 400)
    }

    const { name, identifier, description, status, priority, isPublic } = result.data

    // If identifier is changing, check uniqueness inside workspace
    if (identifier && identifier !== project.identifier) {
      const existing = await prisma.project.findFirst({
        where: {
          workspaceId: project.workspaceId,
          identifier,
          id: { not: id }
        }
      })
      if (existing) {
        return apiError('IDENTIFIER_TAKEN', 'A project with this identifier already exists in this workspace', 400)
      }
    }

    const updated = await prisma.project.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        identifier: identifier !== undefined ? identifier : undefined,
        description: description !== undefined ? description : undefined,
        status: status !== undefined ? status : undefined,
        priority: priority !== undefined ? priority : undefined,
        isPublic: isPublic !== undefined ? isPublic : undefined
      }
    })

    return apiSuccess(updated, 'Project updated successfully')
  } catch (error: any) {
    console.error('Update project error:', error)
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

    const project = await prisma.project.findUnique({
      where: { id }
    })

    if (!project) {
      return apiError('NOT_FOUND', 'Project not found', 404)
    }

    // Retrieve requester's workspace role and project role
    const [workspaceMember, projectMember] = await Promise.all([
      prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: project.workspaceId,
            userId
          }
        }
      }),
      prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: id,
            userId
          }
        }
      })
    ])

    const isWorkspaceOwner = workspaceMember?.role === 'owner'
    const isProjectLead = projectMember?.role === 'lead'

    if (!isWorkspaceOwner && !isProjectLead) {
      return apiError('FORBIDDEN', 'Only project leads and workspace owners can delete this project', 403)
    }

    // Delete project (cascade delete clears members, boards, columns, tasks, etc.)
    await prisma.project.delete({
      where: { id }
    })

    return apiSuccess(null, 'Project deleted successfully')
  } catch (error: any) {
    console.error('Delete project error:', error)
    return apiError('INTERNAL_SERVER_ERROR', error.message || 'Something went wrong', 500)
  }
}
