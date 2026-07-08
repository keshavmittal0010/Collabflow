import { NextRequest } from 'next/server'
import crypto from 'node:crypto'
import { prisma } from '@/lib/prisma'
import { InviteMemberSchema } from '@/lib/validations'
import { apiSuccess, apiError } from '@/lib/utils'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return apiError('UNAUTHORIZED', 'Authentication required', 401)
    }

    // Verify requesting user is owner or admin in the workspace
    const requesterMembership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: id,
          userId
        }
      }
    })

    if (!requesterMembership || (requesterMembership.role !== 'owner' && requesterMembership.role !== 'admin')) {
      return apiError('FORBIDDEN', 'Only owners and admins can invite members', 403)
    }

    const body = await req.json()
    const result = InviteMemberSchema.safeParse(body)

    if (!result.success) {
      return apiError('VALIDATION_ERROR', result.error.issues[0].message, 400)
    }

    const { email, role } = result.data

    // Check if the user is already a member
    const existingMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: id,
        user: { email }
      }
    })

    if (existingMember) {
      return apiError('MEMBER_ALREADY_EXISTS', 'This email is already a member of the workspace', 400)
    }

    // Check if there is already an active pending invite
    const existingInvite = await prisma.workspaceInvite.findFirst({
      where: {
        workspaceId: id,
        email,
        expiresAt: { gt: new Date() },
        acceptedAt: null
      }
    })

    if (existingInvite) {
      // Re-use or extend existing invite
      return apiSuccess(existingInvite, 'Invite link already exists for this email')
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // Expires in 7 days

    const invite = await prisma.workspaceInvite.create({
      data: {
        workspaceId: id,
        email,
        role,
        token,
        invitedBy: userId,
        expiresAt
      }
    })

    return apiSuccess(invite, 'Invitation generated successfully', 201)
  } catch (error: any) {
    console.error('Invite member error:', error)
    return apiError('INTERNAL_SERVER_ERROR', error.message || 'Something went wrong', 500)
  }
}
