import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/utils'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id: workspaceId, memberId } = await params
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return apiError('UNAUTHORIZED', 'Authentication required', 401)
    }

    // Get requester's membership
    const requesterMembership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId
        }
      }
    })

    if (!requesterMembership || (requesterMembership.role !== 'owner' && requesterMembership.role !== 'admin')) {
      return apiError('FORBIDDEN', 'Only owners and admins can manage members', 403)
    }

    const body = await req.json()
    const { role } = body

    if (!role || !['admin', 'member', 'viewer'].includes(role)) {
      return apiError('VALIDATION_ERROR', 'Invalid role specified', 400)
    }

    // Get target member membership
    const targetMember = await prisma.workspaceMember.findUnique({
      where: { id: memberId }
    })

    if (!targetMember) {
      return apiError('NOT_FOUND', 'Workspace member not found', 404)
    }

    // Cannot modify the owner
    if (targetMember.role === 'owner') {
      return apiError('FORBIDDEN', 'Cannot modify the workspace owner', 403)
    }

    // Admins cannot promote to owner or demote other admins/owners
    if (requesterMembership.role === 'admin' && (role === 'owner' || targetMember.role === 'admin')) {
      return apiError('FORBIDDEN', 'Admins cannot modify roles of other admins or promote to owner', 403)
    }

    const updated = await prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role: role as any }
    })

    return apiSuccess(updated, 'Member role updated successfully')
  } catch (error: any) {
    console.error('Update member role error:', error)
    return apiError('INTERNAL_SERVER_ERROR', error.message || 'Something went wrong', 500)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id: workspaceId, memberId } = await params
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return apiError('UNAUTHORIZED', 'Authentication required', 401)
    }

    // Get requester's membership
    const requesterMembership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId
        }
      }
    })

    if (!requesterMembership || (requesterMembership.role !== 'owner' && requesterMembership.role !== 'admin')) {
      return apiError('FORBIDDEN', 'Only owners and admins can manage members', 403)
    }

    // Get target member membership
    const targetMember = await prisma.workspaceMember.findUnique({
      where: { id: memberId }
    })

    if (!targetMember) {
      return apiError('NOT_FOUND', 'Workspace member not found', 404)
    }

    // Cannot remove the owner
    if (targetMember.role === 'owner') {
      return apiError('FORBIDDEN', 'Cannot remove the workspace owner', 403)
    }

    // Admins cannot remove other admins
    if (requesterMembership.role === 'admin' && targetMember.role === 'admin') {
      return apiError('FORBIDDEN', 'Admins cannot remove other admins', 403)
    }

    await prisma.workspaceMember.delete({
      where: { id: memberId }
    })

    return apiSuccess(null, 'Member removed successfully')
  } catch (error: any) {
    console.error('Remove member error:', error)
    return apiError('INTERNAL_SERVER_ERROR', error.message || 'Something went wrong', 500)
  }
}
