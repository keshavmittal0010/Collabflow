import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth.store'
import { AuthService } from '@/services/auth.service'
import { LoginInput, RegisterInput, AuthResponse, ApiResponse } from '@/types/auth.types'
import { useRouter } from 'next/navigation'

export function useAuth() {
  const router = useRouter()
  const queryClient = useQueryClient()
  
  const {
    user,
    accessToken,
    isInitialized,
    setUser,
    setAccessToken,
    setInitialized,
    logout: storeLogout
  } = useAuthStore()

  /**
   * Attempt to silently restore the user session on initial load
   */
  const restoreSession = async () => {
    if (isInitialized) return
    try {
      const refreshRes = await AuthService.refresh()
      if (refreshRes.success) {
        await AuthService.me()
      } else {
        // Clear cookies on server to avoid redirect traps
        await AuthService.logout().catch(() => {})
      }
    } catch (error) {
      console.log('No active session found')
      await AuthService.logout().catch(() => {})
    } finally {
      setInitialized(true)
    }
  }

  /**
   * Mutation wrapper for registering a user
   */
  const registerMutation = useMutation<ApiResponse<AuthResponse>, Error, RegisterInput>({
    mutationFn: AuthService.register,
    onSuccess: (res) => {
      if (res.success) {
        queryClient.setQueryData(['user'], res.data.user)
        router.push('/dashboard')
      }
    }
  })

  /**
   * Mutation wrapper for logging in a user
   */
  const loginMutation = useMutation<ApiResponse<AuthResponse>, Error, LoginInput>({
    mutationFn: AuthService.login,
    onSuccess: (res) => {
      if (res.success) {
        queryClient.setQueryData(['user'], res.data.user)
        router.push('/dashboard')
      }
    }
  })

  /**
   * Mutation wrapper for logging out
   */
  const logoutMutation = useMutation<ApiResponse<null>, Error, void>({
    mutationFn: AuthService.logout,
    onSuccess: () => {
      queryClient.clear()
      storeLogout()
      router.push('/login')
    }
  })

  return {
    user,
    accessToken,
    isInitialized,
    isAuthenticated: !!user,
    restoreSession,
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    registerStatus: registerMutation.status,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginStatus: loginMutation.status,
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending
  }
}

export default useAuth
