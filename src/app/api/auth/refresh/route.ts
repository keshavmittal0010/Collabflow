import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { verifyRefreshToken, signAccessToken, signRefreshToken } from '@/lib/auth'
import { apiSuccess, apiError } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const oldRefreshToken = cookieStore.get('refreshToken')?.value

    if (!oldRefreshToken) {
      return apiError('UNAUTHORIZED', 'No refresh token provided', 401)
    }

    // Verify token structure & expiration
    let payload
    try {
      payload = await verifyRefreshToken(oldRefreshToken)
    } catch (err) {
      return apiError('UNAUTHORIZED', 'Invalid or expired refresh token', 401)
    }

    const userId = payload.sub

    // Check database to ensure token exists and hasn't expired yet
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: oldRefreshToken }
    })

    if (!storedToken) {
      return apiError('UNAUTHORIZED', 'Refresh token not recognized', 401)
    }

    if (storedToken.expiresAt < new Date()) {
      // Clean up expired token
      try {
        await prisma.refreshToken.delete({ where: { token: oldRefreshToken } })
      } catch (err) {}
      
      cookieStore.delete('refreshToken')
      return apiError('UNAUTHORIZED', 'Refresh token expired', 401)
    }

    // Retrieve user details to sign access token
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return apiError('UNAUTHORIZED', 'User not found', 401)
    }

    // Rotate tokens (generate new ones)
    const newAccessToken = await signAccessToken({
      sub: user.id,
      email: user.email,
      name: user.name
    })

    const newRefreshToken = await signRefreshToken({
      sub: user.id
    })

    // Delete old refresh token, save new refresh token
    await prisma.$transaction([
      prisma.refreshToken.delete({ where: { token: oldRefreshToken } }),
      prisma.refreshToken.create({
        data: {
          token: newRefreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      })
    ])

    // Set cookie
    cookieStore.set('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })
    cookieStore.set('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60 // 15 mins
    })

    return apiSuccess({
      accessToken: newAccessToken
    }, 'Tokens refreshed successfully')
  } catch (error: any) {
    console.error('Refresh token error:', error)
    return apiError('INTERNAL_SERVER_ERROR', error.message || 'Something went wrong', 500)
  }
}
