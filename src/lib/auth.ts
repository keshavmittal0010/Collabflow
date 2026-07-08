import { SignJWT, jwtVerify } from 'jose'
import { JwtPayload } from '@/types/auth.types'

const getAccessSecret = () => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not defined')
  }
  return new TextEncoder().encode(secret)
}

const getRefreshSecret = () => {
  const secret = process.env.JWT_REFRESH_SECRET
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET environment variable is not defined')
  }
  return new TextEncoder().encode(secret)
}

/**
 * Sign an Access Token
 */
export async function signAccessToken(payload: {
  sub: string
  email: string
  name: string
}): Promise<string> {
  const secret = getAccessSecret()
  const exp = process.env.JWT_EXPIRES_IN || '15m'
  
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(secret)
}

/**
 * Verify an Access Token
 */
export async function verifyAccessToken(token: string): Promise<JwtPayload> {
  const secret = getAccessSecret()
  const { payload } = await jwtVerify(token, secret)
  return payload as unknown as JwtPayload
}

/**
 * Sign a Refresh Token
 */
export async function signRefreshToken(payload: { sub: string }): Promise<string> {
  const secret = getRefreshSecret()
  const exp = process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(secret)
}

/**
 * Verify a Refresh Token
 */
export async function verifyRefreshToken(token: string): Promise<{ sub: string }> {
  const secret = getRefreshSecret()
  const { payload } = await jwtVerify(token, secret)
  return payload as unknown as { sub: string }
}
