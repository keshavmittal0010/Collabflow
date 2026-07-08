import { create } from 'zustand'
import { WorkspaceWithMembers } from '@/types/workspace.types'
import { WorkspaceService } from '@/services/workspace.service'

interface WorkspaceState {
  workspaces: WorkspaceWithMembers[]
  currentWorkspace: WorkspaceWithMembers | null
  isLoading: boolean
  error: string | null
  setWorkspaces: (workspaces: WorkspaceWithMembers[]) => void
  setCurrentWorkspace: (workspace: WorkspaceWithMembers | null) => void
  fetchWorkspaces: () => Promise<void>
  selectWorkspaceBySlug: (slug: string) => void
  clearWorkspaces: () => void
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  currentWorkspace: null,
  isLoading: false,
  error: null,
  
  setWorkspaces: (workspaces) => set({ workspaces }),
  
  setCurrentWorkspace: (currentWorkspace) => set({ currentWorkspace }),
  
  clearWorkspaces: () => set({ workspaces: [], currentWorkspace: null }),
  
  fetchWorkspaces: async () => {
    set({ isLoading: true, error: null })
    try {
      const res = await WorkspaceService.listWorkspaces()
      if (res.success) {
        set({ workspaces: res.data, isLoading: false })
        const current = get().currentWorkspace
        if (res.data.length > 0) {
          const stillExists = current ? res.data.find((w) => w.id === current.id) : null
          if (stillExists) {
            set({ currentWorkspace: stillExists })
          } else {
            // Default to first workspace if not set
            set({ currentWorkspace: res.data[0] })
          }
        } else {
          set({ currentWorkspace: null })
        }
      } else {
        set({ error: res.message, isLoading: false })
      }
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch workspaces', isLoading: false })
    }
  },

  selectWorkspaceBySlug: (slug) => {
    const ws = get().workspaces.find((w) => w.slug === slug)
    if (ws) {
      set({ currentWorkspace: ws })
    }
  }
}))

export default useWorkspaceStore
