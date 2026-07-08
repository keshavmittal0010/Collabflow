import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get('refreshToken')?.value

    if (refreshToken) {
      // Remove from DB (using try/catch in case it's already deleted or invalid)
      try {
        await prisma.refreshToken.delete({
          where: { token: refreshToken }
        })
      } catch (dbError) {
        // Token might not exist in DB, ignore and proceed
      }
    }

    // Clear cookies
    cookieStore.delete('refreshToken')
    cookieStore.delete('accessToken')

    return apiSuccess(null, 'Logged out successfully')
  } catch (error: any) {
    console.error('Logout error:', error)
    return apiError('INTERNAL_SERVER_ERROR', error.message || 'Something went wrong', 500)
  }
}
