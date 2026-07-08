import { useAuthStore } from '@/store/auth.store'
import { LoginInput, RegisterInput, AuthResponse, ApiResponse } from '@/types/auth.types'

/**
 * Custom fetch wrapper that automatically:
 * - Injects the Authorization header if an access token is in store
 * - Formats request bodies as JSON
 * - Intercepts 401 errors and attempts token refresh via HTTP-only cookie
 */
let refreshPromise: Promise<ApiResponse<{ accessToken: string }>> | null = null

async function runRefresh(): Promise<ApiResponse<{ accessToken: string }>> {
  try {
    const refreshResponse = await fetch('/api/auth/refresh', {
      method: 'POST'
    })
    const refreshData: ApiResponse<{ accessToken: string }> = await refreshResponse.json()
    return refreshData
  } catch (err: any) {
    return {
      success: false as const,
      error: 'REFRESH_FAILED',
      message: err.message || 'Refresh request failed'
    }
  } finally {
    refreshPromise = null
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const { accessToken, setAccessToken, logout } = useAuthStore.getState()
  
  const headers = new Headers(options.headers || {})
  
  if (accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers
  }

  // Auto-serialize object body to JSON string
  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
    fetchOptions.body = JSON.stringify(options.body)
  }

  try {
    let response = await fetch(path, fetchOptions)

    // Token expired / Unauthorized - attempt silent token rotation
    if (response.status === 401 && path !== '/api/auth/login' && path !== '/api/auth/refresh' && path !== '/api/auth/register') {
      try {
        if (!refreshPromise) {
          refreshPromise = runRefresh()
        }
        const refreshData = await refreshPromise

        if (refreshData.success) {
          // Store new access token
          setAccessToken(refreshData.data.accessToken)
          
          // Re-inject new token & retry original request
          headers.set('Authorization', `Bearer ${refreshData.data.accessToken}`)
          response = await fetch(path, fetchOptions)
        } else {
          // Silent refresh failed -> log out user
          logout()
        }
      } catch (refreshErr) {
        logout()
      }
    }

    const data: ApiResponse<T> = await response.json()
    return data
  } catch (error: any) {
    return {
      success: false,
      error: 'NETWORK_ERROR',
      message: error.message || 'Network request failed'
    }
  }
}

export const AuthService = {
  /**
   * Register a new user
   */
  async register(input: RegisterInput): Promise<ApiResponse<AuthResponse>> {
    const res = await apiFetch<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: input as any
    })
    
    if (res.success) {
      useAuthStore.getState().setUser(res.data.user)
      useAuthStore.getState().setAccessToken(res.data.accessToken)
    }
    
    return res
  },

  /**
   * Log in an existing user
   */
  async login(input: LoginInput): Promise<ApiResponse<AuthResponse>> {
    const res = await apiFetch<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: input as any
    })
    
    if (res.success) {
      useAuthStore.getState().setUser(res.data.user)
      useAuthStore.getState().setAccessToken(res.data.accessToken)
    }
    
    return res
  },

  /**
   * Log out the current user
   */
  async logout(): Promise<ApiResponse<null>> {
    const res = await apiFetch<null>('/api/auth/logout', {
      method: 'POST'
    })
    
    // Always clear local store regardless of API response
    useAuthStore.getState().logout()
    return res
  },

  /**
   * Get the current user profile (using current access token)
   */
  async me(): Promise<ApiResponse<any>> {
    const res = await apiFetch<any>('/api/auth/me', {
      method: 'GET'
    })
    
    if (res.success) {
      useAuthStore.getState().setUser(res.data)
    } else {
      useAuthStore.getState().logout()
      // Purge stale access tokens on server to prevent redirect traps
      await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    }
    
    return res
  },

  /**
   * Update current user profile details
   */
  async updateProfile(input: any): Promise<ApiResponse<any>> {
    const res = await apiFetch<any>('/api/auth/me', {
      method: 'PATCH',
      body: input
    })
    if (res.success) {
      useAuthStore.getState().setUser(res.data)
    }
    return res
  },

  /**
   * Refresh the access token manually
   */
  async refresh(): Promise<ApiResponse<{ accessToken: string }>> {
    const res = await apiFetch<{ accessToken: string }>('/api/auth/refresh', {
      method: 'POST'
    })
    
    if (res.success) {
      useAuthStore.getState().setAccessToken(res.data.accessToken)
    } else {
      useAuthStore.getState().logout()
    }
    
    return res
  }
}
export default AuthService
