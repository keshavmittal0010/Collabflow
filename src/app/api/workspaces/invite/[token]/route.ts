import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/utils'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    const invite = await prisma.workspaceInvite.findUnique({
      where: { token },
      include: {
        workspace: {
          select: {
            name: true,
            logoUrl: true
          }
        },
        sender: {
          select: {
            name: true,
            avatarUrl: true
          }
        }
      }
    })

    if (!invite) {
      return apiError('NOT_FOUND', 'Invitation link invalid or not found', 404)
    }

    if (invite.expiresAt < new Date()) {
      return apiError('EXPIRED', 'This invitation has expired', 400)
    }

    if (invite.acceptedAt) {
      return apiError('ALREADY_ACCEPTED', 'This invitation has already been accepted', 400)
    }

    return apiSuccess({
      id: invite.id,
      email: invite.email,
      role: invite.role,
      workspace: invite.workspace,
      sender: invite.sender
    }, 'Invitation verified successfully')
  } catch (error: any) {
    console.error('Verify invite error:', error)
    return apiError('INTERNAL_SERVER_ERROR', error.message || 'Something went wrong', 500)
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return apiError('UNAUTHORIZED', 'Authentication required', 401)
    }

    // Fetch user profile to match email if needed
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return apiError('UNAUTHORIZED', 'User profile not found', 401)
    }

    // Look up invite
    const invite = await prisma.workspaceInvite.findUnique({
      where: { token }
    })

    if (!invite) {
      return apiError('NOT_FOUND', 'Invitation link invalid or not found', 404)
    }

    if (invite.expiresAt < new Date()) {
      return apiError('EXPIRED', 'This invitation has expired', 400)
    }

    if (invite.acceptedAt) {
      return apiError('ALREADY_ACCEPTED', 'This invitation has already been accepted', 400)
    }

    // Enforce email matching for strict security (optional, but highly professional!)
    // If you want any logged-in user to accept, comment this check out. We will check it.
    if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
      return apiError(
        'EMAIL_MISMATCH',
        `This invite was sent to ${invite.email}, but you are logged in as ${user.email}`,
        400
      )
    }

    // Check if the user is already a member
    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: invite.workspaceId,
          userId: user.id
        }
      }
    })

    if (existingMember) {
      // Mark invite accepted since they are already a member
      await prisma.workspaceInvite.update({
        where: { token },
        data: { acceptedAt: new Date() }
      })
      return apiSuccess({ workspaceId: invite.workspaceId }, 'You are already a member of this workspace')
    }

    // Accept invitation inside a transaction
    await prisma.$transaction([
      prisma.workspaceMember.create({
        data: {
          workspaceId: invite.workspaceId,
          userId: user.id,
          role: invite.role
        }
      }),
      prisma.workspaceInvite.update({
        where: { token },
        data: {
          acceptedAt: new Date()
        }
      })
    ])

    return apiSuccess({ workspaceId: invite.workspaceId }, 'Invitation accepted successfully')
  } catch (error: any) {
    console.error('Accept invite error:', error)
    return apiError('INTERNAL_SERVER_ERROR', error.message || 'Something went wrong', 500)
  }
}
