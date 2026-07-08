import { prisma } from '@/lib/prisma'
import { getIO } from '@/lib/io'
import { NotificationType } from '@prisma/client'

export async function createNotification(params: {
  userId: string
  type: NotificationType
  title: string
  body?: string | null
  actionUrl?: string | null
  actorId?: string | null
  entityType?: string | null
  entityId?: string | null
}) {
  try {
    const notification = await prisma.notification.create({
      data: params,
      include: {
        actor: {
          select: { id: true, name: true, avatarUrl: true }
        }
      }
    })

    // Push real-time notification over Socket.io
    const io = getIO()
    if (io) {
      io.to(`user:${params.userId}`).emit('notification:new', notification as any)
    }

    return notification
  } catch (error) {
    console.error('Failed to create notification:', error)
    return null
  }
}

export async function scanAndNotifyMentions(
  text: string | null | undefined,
  actorId: string,
  workspaceId: string,
  entityInfo: {
    type: 'task' | 'comment' | 'message'
    id: string
    title: string
    actionUrl: string
  }
) {
  if (!text || !text.includes('@')) return

  try {
    // Fetch all members of the workspace
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: { id: true, name: true }
        }
      }
    })

    const lowerText = text.toLowerCase()
    const notifiedUserIds = new Set<string>()

    const actor = await prisma.user.findUnique({
      where: { id: actorId },
      select: { name: true }
    })
    const actorName = actor?.name || 'Someone'

    for (const member of members) {
      const { user } = member
      if (user.id === actorId) continue // Don't notify yourself

      // Form handles e.g. @john_doe, @johndoe, @john
      const handles = [
        `@${user.name.toLowerCase().replace(/\s+/g, '_')}`,
        `@${user.name.toLowerCase().replace(/\s+/g, '')}`,
        `@${user.name.toLowerCase().split(' ')[0]}`
      ]

      const isMentioned = handles.some((handle) => lowerText.includes(handle))

      if (isMentioned && !notifiedUserIds.has(user.id)) {
        notifiedUserIds.add(user.id)

        await createNotification({
          userId: user.id,
          type: 'mention',
          title: `Mentioned in ${entityInfo.type}`,
          body: `${actorName} mentioned you in "${entityInfo.title}": "${text.substring(0, 80)}${text.length > 80 ? '...' : ''}"`,
          actionUrl: entityInfo.actionUrl,
          actorId,
          entityType: entityInfo.type,
          entityId: entityInfo.id
        })
      }
    }
  } catch (error) {
    console.error('Scan and notify mentions error:', error)
  }
}
