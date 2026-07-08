import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { RegisterSchema } from '@/lib/validations'
import { signAccessToken, signRefreshToken } from '@/lib/auth'
import { apiSuccess, apiError } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = RegisterSchema.safeParse(body)
    
    if (!result.success) {
      return apiError('VALIDATION_ERROR', result.error.issues[0].message, 400)
    }

    const { email, password, name } = result.data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return apiError('USER_ALREADY_EXISTS', 'A user with this email already exists', 400)
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: hashedPassword,
        theme: 'system',
        timezone: 'UTC'
      }
    })

    // Generate tokens
    const accessToken = await signAccessToken({
      sub: user.id,
      email: user.email,
      name: user.name
    })

    const refreshToken = await signRefreshToken({
      sub: user.id
    })

    // Save refresh token to DB
    const refreshExpiresAt = new Date()
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7) // 7 days from now

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: refreshExpiresAt
      }
    })

    // Set HTTP-only cookie
    const cookieStore = await cookies()
    cookieStore.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })
    cookieStore.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60 // 15 mins
    })

    // Return success
    return apiSuccess({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        theme: user.theme,
        timezone: user.timezone,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen
      },
      accessToken
    }, 'Registration successful', 201)
  } catch (error: any) {
    console.error('Registration error:', error)
    return apiError('INTERNAL_SERVER_ERROR', error.message || 'Something went wrong', 500)
  }
}
