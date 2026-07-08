import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/utils'

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id')

    if (!userId) {
      return apiError('UNAUTHORIZED', 'Authentication required', 401)
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return apiError('USER_NOT_FOUND', 'User profile not found', 404)
    }

    return apiSuccess({
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      theme: user.theme,
      timezone: user.timezone,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen
    }, 'User profile retrieved successfully')
  } catch (error: any) {
    console.error('Me endpoint error:', error)
    return apiError('INTERNAL_SERVER_ERROR', error.message || 'Something went wrong', 500)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id')

    if (!userId) {
      return apiError('UNAUTHORIZED', 'Authentication required', 401)
    }

    const body = await req.json()
    const { name, bio, timezone, theme, avatarUrl } = body

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name !== undefined ? name : undefined,
        bio: bio !== undefined ? bio : undefined,
        timezone: timezone !== undefined ? timezone : undefined,
        theme: theme !== undefined ? theme : undefined,
        avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined
      }
    })

    return apiSuccess({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      avatarUrl: updatedUser.avatarUrl,
      bio: updatedUser.bio,
      theme: updatedUser.theme,
      timezone: updatedUser.timezone
    }, 'Profile updated successfully')
  } catch (error: any) {
    console.error('Update profile error:', error)
    return apiError('INTERNAL_SERVER_ERROR', error.message || 'Something went wrong', 500)
  }
}

