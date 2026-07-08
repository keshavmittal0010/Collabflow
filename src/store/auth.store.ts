import { create } from 'zustand'
import { AuthUser } from '@/types/auth.types'

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  isInitialized: boolean
  setUser: (user: AuthUser | null) => void
  setAccessToken: (token: string | null) => void
  setInitialized: (initialized: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isInitialized: false,
  setUser: (user) => set({ user }),
  setAccessToken: (token) => set({ accessToken: token }),
  setInitialized: (isInitialized) => set({ isInitialized }),
  logout: () => {
    set({ user: null, accessToken: null })
    try {
      // Clear workspaces and projects dynamically to avoid circular references
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { useWorkspaceStore } = require('./workspace.store')
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { useProjectStore } = require('./project.store')
      useWorkspaceStore.getState().clearWorkspaces()
      useProjectStore.getState().clearProjects()
    } catch (err) {
      console.error('Failed to clear state stores on logout:', err)
    }
  }
}))
