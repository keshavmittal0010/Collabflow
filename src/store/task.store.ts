import { create } from 'zustand'
import { TaskWithDetails } from '@/types/project.types'

interface TaskState {
  // All tasks for the currently viewed project (keyed flat list)
  tasks: TaskWithDetails[]
  // Currently open task in the drawer
  activeTask: TaskWithDetails | null
  // Drawer visibility
  isDrawerOpen: boolean
  // Loading / error state
  isLoading: boolean
  error: string | null

  // Actions
  setTasks: (tasks: TaskWithDetails[]) => void
  addTask: (task: TaskWithDetails) => void
  updateTask: (updatedTask: TaskWithDetails) => void
  removeTask: (taskId: string) => void
  openDrawer: (task: TaskWithDetails) => void
  closeDrawer: () => void
  setActiveTask: (task: TaskWithDetails | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearTasks: () => void

  /**
   * Optimistically move a task to a new column with a new position.
   * This updates local state immediately so drag-and-drop feels instant.
   * The actual API call is made separately and will confirm or revert.
   */
  optimisticMoveTask: (
    taskId: string,
    toColumnId: string,
    newPosition: number,
    newStatus: string
  ) => void
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  activeTask: null,
  isDrawerOpen: false,
  isLoading: false,
  error: null,

  setTasks: (tasks) => set({ tasks }),

  addTask: (task) =>
    set((state) => ({
      tasks: [...state.tasks, task]
    })),

  updateTask: (updatedTask) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
      // If the drawer is showing this task, update it too
      activeTask:
        state.activeTask?.id === updatedTask.id ? updatedTask : state.activeTask
    })),

  removeTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== taskId),
      activeTask: state.activeTask?.id === taskId ? null : state.activeTask,
      isDrawerOpen:
        state.activeTask?.id === taskId ? false : state.isDrawerOpen
    })),

  openDrawer: (task) => set({ activeTask: task, isDrawerOpen: true }),

  closeDrawer: () => set({ isDrawerOpen: false, activeTask: null }),

  setActiveTask: (task) => set({ activeTask: task }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  clearTasks: () =>
    set({ tasks: [], activeTask: null, isDrawerOpen: false, error: null }),

  optimisticMoveTask: (taskId, toColumnId, newPosition, newStatus) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? { ...t, columnId: toColumnId, position: newPosition, status: newStatus }
          : t
      ),
      activeTask:
        state.activeTask?.id === taskId
          ? {
              ...state.activeTask,
              columnId: toColumnId,
              position: newPosition,
              status: newStatus
            }
          : state.activeTask
    }))
}))

export default useTaskStore
