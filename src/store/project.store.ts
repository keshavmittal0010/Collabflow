import { create } from 'zustand'
import { Project, ProjectWithDetails, Board } from '@/types/project.types'
import { ProjectService } from '@/services/project.service'

interface ProjectState {
  projects: Project[]
  currentProject: ProjectWithDetails | null
  currentBoard: Board | null
  isLoading: boolean
  error: string | null
  setProjects: (projects: Project[]) => void
  setCurrentProject: (project: ProjectWithDetails | null) => void
  setCurrentBoard: (board: Board | null) => void
  clearProjects: () => void
  fetchProjects: (workspaceId: string) => Promise<void>
  fetchProjectDetails: (projectId: string) => Promise<void>
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  currentBoard: null,
  isLoading: false,
  error: null,

  setProjects: (projects) => set({ projects }),
  
  setCurrentProject: (currentProject) => set({ currentProject }),
  
  setCurrentBoard: (currentBoard) => set({ currentBoard }),
  
  clearProjects: () => set({ projects: [], currentProject: null, currentBoard: null }),

  fetchProjects: async (workspaceId) => {
    set({ isLoading: true, error: null })
    try {
      const res = await ProjectService.listProjects(workspaceId)
      if (res.success) {
        set({ projects: res.data, isLoading: false })
      } else {
        set({ error: res.message, isLoading: false })
      }
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch projects', isLoading: false })
    }
  },

  fetchProjectDetails: async (projectId) => {
    set({ isLoading: true, error: null })
    try {
      const res = await ProjectService.getProject(projectId)
      if (res.success) {
        set({ currentProject: res.data, isLoading: false })
        // Default to first board if boards exist
        if (res.data.boards && res.data.boards.length > 0) {
          set({ currentBoard: res.data.boards[0] })
        } else {
          set({ currentBoard: null })
        }
      } else {
        set({ error: res.message, isLoading: false })
      }
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch project details', isLoading: false })
    }
  }
}))

export default useProjectStore
