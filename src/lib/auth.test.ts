import { describe, test, expect, beforeAll } from 'vitest'
import { signAccessToken, verifyAccessToken, signRefreshToken, verifyRefreshToken } from './auth'

describe('Auth tokens JWT helpers tests', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test_access_token_secret_key_long_enough_12345'
    process.env.JWT_REFRESH_SECRET = 'test_refresh_token_secret_key_long_enough_12345'
  })

  test('signs and verifies access tokens successfully', async () => {
    const payload = {
      sub: 'user-id-123',
      email: 'test@example.com',
      name: 'John Doe'
    }

    const token = await signAccessToken(payload)
    expect(token).toBeTypeOf('string')

    const verified = await verifyAccessToken(token)
    expect(verified.sub).toBe(payload.sub)
    expect(verified.email).toBe(payload.email)
    expect(verified.name).toBe(payload.name)
  })

  test('signs and verifies refresh tokens successfully', async () => {
    const payload = { sub: 'user-id-123' }

    const token = await signRefreshToken(payload)
    expect(token).toBeTypeOf('string')

    const verified = await verifyRefreshToken(token)
    expect(verified.sub).toBe(payload.sub)
  })
})
