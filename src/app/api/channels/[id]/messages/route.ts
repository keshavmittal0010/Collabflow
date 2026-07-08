import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CreateMessageSchema } from '@/lib/validations'
import { apiSuccess, apiError } from '@/lib/utils'
import { getIO } from '@/lib/io'
import { scanAndNotifyMentions } from '@/lib/notification.helper'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: channelId } = await params
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return apiError('UNAUTHORIZED', 'Authentication required', 401)
    }

    const channel = await prisma.channel.findUnique({
      where: { id: channelId }
    })

    if (!channel) {
      return apiError('NOT_FOUND', 'Channel not found', 404)
    }

    // Verify member of workspace
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: channel.workspaceId,
          userId
        }
      }
    })

    if (!workspaceMember) {
      return apiError('FORBIDDEN', 'You do not have access to this workspace', 403)
    }

    // For private channels, must be member of channel
    if (channel.type === 'private') {
      const channelMember = await prisma.channelMember.findUnique({
        where: {
          channelId_userId: {
            channelId,
            userId
          }
        }
      })
      if (!channelMember) {
        return apiError('FORBIDDEN', 'You are not a member of this private channel', 403)
      }
    }

    const body = await req.json()
    const result = CreateMessageSchema.safeParse(body)

    if (!result.success) {
      return apiError('VALIDATION_ERROR', result.error.issues[0].message, 400)
    }

    const { content, parentId } = result.data

    // If parentId is specified, verify it's a message in the same channel
    if (parentId) {
      const parentMessage = await prisma.message.findUnique({
        where: { id: parentId }
      })
      if (!parentMessage || parentMessage.channelId !== channelId) {
        return apiError('BAD_REQUEST', 'Parent message does not belong to this channel', 400)
      }
    }

    const newMessage = await prisma.message.create({
      data: {
        channelId,
        authorId: userId,
        parentId: parentId ?? null,
        content
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, avatarUrl: true }
        },
        reactions: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true }
            }
          }
        }
      }
    })

    // Broadcast new message over socket to channel room
    const io = getIO()
    if (io) {
      io.to(`channel:${channelId}`).emit('message:new' as any, newMessage as any)
    }

    // Scan mentions in message content
    if (content) {
      await scanAndNotifyMentions(content, userId, channel.workspaceId, {
        type: 'message',
        id: newMessage.id,
        title: channel.name.startsWith('dm-') ? 'Direct Message' : `#${channel.name}`,
        actionUrl: `/chat`
      })
    }

    return apiSuccess(newMessage, 'Message sent successfully', 201)
  } catch (error: any) {
    console.error('Send message error:', error)
    return apiError('INTERNAL_SERVER_ERROR', error.message || 'Something went wrong', 500)
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: channelId } = await params
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return apiError('UNAUTHORIZED', 'Authentication required', 401)
    }

    const channel = await prisma.channel.findUnique({
      where: { id: channelId }
    })

    if (!channel) {
      return apiError('NOT_FOUND', 'Channel not found', 404)
    }

    // Verify workspace membership
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: channel.workspaceId,
          userId
        }
      }
    })

    if (!workspaceMember) {
      return apiError('FORBIDDEN', 'You do not have access to this workspace', 403)
    }

    // For private channels, must be member of channel
    if (channel.type === 'private') {
      const channelMember = await prisma.channelMember.findUnique({
        where: {
          channelId_userId: {
            channelId,
            userId
          }
        }
      })
      if (!channelMember) {
        return apiError('FORBIDDEN', 'You are not a member of this private channel', 403)
      }
    }

    // Fetch top-level messages (parentId: null) for this channel
    // In our simplified layout, replies are displayed in a separate thread panel.
    const messages = await prisma.message.findMany({
      where: {
        channelId,
        parentId: null
      },
      orderBy: {
        createdAt: 'asc'
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, avatarUrl: true }
        },
        reactions: {
          include: {
            user: {
              select: { id: true, name: true }
            }
          }
        },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: { id: true, name: true, email: true, avatarUrl: true }
            }
          }
        }
      }
    })

    return apiSuccess(messages, 'Messages retrieved successfully')
  } catch (error: any) {
    console.error('Fetch messages error:', error)
    return apiError('INTERNAL_SERVER_ERROR', error.message || 'Something went wrong', 500)
  }
}
