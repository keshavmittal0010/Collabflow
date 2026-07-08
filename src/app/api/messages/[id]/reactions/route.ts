import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/utils'
import { getIO } from '@/lib/io'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: messageId } = await params
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return apiError('UNAUTHORIZED', 'Authentication required', 401)
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { channel: true }
    })

    if (!message) {
      return apiError('NOT_FOUND', 'Message not found', 404)
    }

    // Verify workspace membership
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: message.channel.workspaceId,
          userId
        }
      }
    })

    if (!workspaceMember) {
      return apiError('FORBIDDEN', 'You do not have access to this workspace', 403)
    }

    const { emoji } = await req.json()
    if (!emoji || typeof emoji !== 'string' || emoji.length > 10) {
      return apiError('BAD_REQUEST', 'Valid emoji is required', 400)
    }

    // Check if user already reacted with this emoji to this message
    const existingReaction = await prisma.reaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji
        }
      }
    })

    if (existingReaction) {
      // Remove reaction
      await prisma.reaction.delete({
        where: { id: existingReaction.id }
      })
    } else {
      // Add reaction
      await prisma.reaction.create({
        data: {
          messageId,
          userId,
          emoji
        }
      })
    }

    // Fetch updated reactions list for the message
    const updatedReactions = await prisma.reaction.findMany({
      where: { messageId },
      include: {
        user: {
          select: { id: true, name: true }
        }
      }
    })

    // Broadcast updated reactions list to channel room
    const io = getIO()
    if (io) {
      io.to(`channel:${message.channelId}`).emit('message:reaction' as any, {
        messageId,
        reactions: updatedReactions
      } as any)
    }

    return apiSuccess(updatedReactions, 'Reaction updated successfully')
  } catch (error: any) {
    console.error('Toggle reaction error:', error)
    return apiError('INTERNAL_SERVER_ERROR', error.message || 'Something went wrong', 500)
  }
}
