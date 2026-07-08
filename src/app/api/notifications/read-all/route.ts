import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/utils'

export async function PATCH(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return apiError('UNAUTHORIZED', 'Authentication required', 401)
    }

    const { searchParams } = new URL(req.url)
    const workspaceId = searchParams.get('workspaceId')

    const updateFilter: any = { userId, isRead: false }
    
    // If workspaceId is specified, only mark notifications for that workspace as read
    // Note: We use actionUrl checks or entity mappings if needed, but since workspace is passed,
    // we can filter actionUrls that contain the workspaceId (e.g. `/workspace/{workspaceId}`)
    if (workspaceId) {
      updateFilter.actionUrl = {
        contains: `/workspace/${workspaceId}`
      }
    }

    await prisma.notification.updateMany({
      where: updateFilter,
      data: { isRead: true }
    })

    return apiSuccess(null, 'All notifications marked as read')
  } catch (error: any) {
    console.error('Mark all notifications read error:', error)
    return apiError('INTERNAL_SERVER_ERROR', error.message || 'Something went wrong', 500)
  }
}
