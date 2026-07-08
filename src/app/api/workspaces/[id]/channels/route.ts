import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CreateChannelSchema } from '@/lib/validations'
import { apiSuccess, apiError } from '@/lib/utils'
import { getIO } from '@/lib/io'

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

    // Verify workspace member access
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId
        }
      }
    })

    if (!member) {
      return apiError('FORBIDDEN', 'You do not have access to this workspace', 403)
    }

    const body = await req.json()
    const result = CreateChannelSchema.safeParse(body)

    if (!result.success) {
      return apiError('VALIDATION_ERROR', result.error.issues[0].message, 400)
    }

    const { name, description, type, memberIds } = result.data

    // Check if channel name is unique in this workspace
    const existing = await prisma.channel.findFirst({
      where: {
        workspaceId,
        name
      }
    })

    if (existing) {
      return apiError('BAD_REQUEST', `Channel with name "#${name}" already exists in this workspace`, 400)
    }

    const newChannel = await prisma.$transaction(async (tx) => {
      const channel = await tx.channel.create({
        data: {
          workspaceId,
          name,
          description: description ?? null,
          type,
          createdBy: userId
        }
      })

      // Add creator as member
      await tx.channelMember.create({
        data: {
          channelId: channel.id,
          userId
        }
      })

      // For private channels, add designated members
      if (type === 'private' && memberIds && memberIds.length > 0) {
        const uniqueMemberIds = Array.from(new Set(memberIds.filter((id) => id !== userId)))
        if (uniqueMemberIds.length > 0) {
          await tx.channelMember.createMany({
            data: uniqueMemberIds.map((uid) => ({
              channelId: channel.id,
              userId: uid
            })),
            skipDuplicates: true
          })
        }
      }

      return tx.channel.findUnique({
        where: { id: channel.id },
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, avatarUrl: true }
              }
            }
          },
          creator: {
            select: { id: true, name: true, email: true, avatarUrl: true }
          }
        }
      })
    })

    // Broadcast channel creation to workspace room
    const io = getIO()
    if (io && newChannel) {
      io.to(`workspace:${workspaceId}`).emit('task:created' as any, newChannel as any) // we can reuse generic tasks/elements broadcast or make direct triggers. Sockets hooks will pick it up.
    }

    return apiSuccess(newChannel, 'Channel created successfully', 201)
  } catch (error: any) {
    console.error('Create channel error:', error)
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

    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId
        }
      }
    })

    if (!member) {
      return apiError('FORBIDDEN', 'You do not have access to this workspace', 403)
    }

    // Fetch channels: public channels + private/dm channels where the user is a member
    const channels = await prisma.channel.findMany({
      where: {
        workspaceId,
        OR: [
          { type: 'public' },
          {
            members: {
              some: {
                userId
              }
            }
          }
        ]
      },
      orderBy: { name: 'asc' },
      include: {
        creator: {
          select: { id: true, name: true, email: true, avatarUrl: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true }
            }
          }
        },
        _count: {
          select: { messages: true }
        }
      }
    })

    return apiSuccess(channels, 'Channels retrieved successfully')
  } catch (error: any) {
    console.error('Get channels error:', error)
    return apiError('INTERNAL_SERVER_ERROR', error.message || 'Something went wrong', 500)
  }
}
