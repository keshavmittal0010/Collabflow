import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/utils'

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

    const notification = await prisma.notification.findUnique({
      where: { id }
    })

    if (!notification) {
      return apiError('NOT_FOUND', 'Notification not found', 404)
    }

    if (notification.userId !== userId) {
      return apiError('FORBIDDEN', 'Access denied', 403)
    }

    // Toggle or read state
    const body = await req.json().catch(() => ({}))
    const isRead = body.isRead !== undefined ? body.isRead : true

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead }
    })

    return apiSuccess(updated, 'Notification status updated')
  } catch (error: any) {
    console.error('Update notification read error:', error)
    return apiError('INTERNAL_SERVER_ERROR', error.message || 'Something went wrong', 500)
  }
}
