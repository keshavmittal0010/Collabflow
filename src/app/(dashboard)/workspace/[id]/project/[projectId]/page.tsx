'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners
} from '@dnd-kit/core'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ProjectService } from '@/services/project.service'
import { TaskService } from '@/services/task.service'
import { useProjectStore } from '@/store/project.store'
import { useTaskStore } from '@/store/task.store'
import { BoardColumnComponent } from '@/components/projects/BoardColumnComponent'
import { TaskCard } from '@/components/tasks/TaskCard'
import { TaskDrawer } from '@/components/tasks/TaskDrawer'
import { useSocket } from '@/hooks/useSocket'
import { useProjectSocket } from '@/hooks/useProjectSocket'
import { usePresence } from '@/hooks/usePresence'
import { TaskWithDetails, BoardColumn } from '@/types/project.types'
import { getColorFromString, getInitials } from '@/lib/utils'
import {
  Settings,
  Plus,
  Info,
  LayoutGrid,
  Calendar,
  List,
  Loader2,
  Wifi,
  WifiOff
} from 'lucide-react'
import Link from 'next/link'

// ─── Fractional index helpers ────────────────────────────────────────────────
function computeNewPosition(
  tasks: TaskWithDetails[],
  overId: string | null,
  activeId: string,
  targetColumnId: string
): number {
  const columnTasks = tasks
    .filter((t) => t.columnId === targetColumnId && t.id !== activeId)
    .sort((a, b) => Number(a.position) - Number(b.position))

  if (columnTasks.length === 0) return 65536.0

  if (!overId || overId === `column-${targetColumnId}`) {
    // Dropped at end
    return Number(columnTasks[columnTasks.length - 1].position) + 65536.0
  }

  const overIdx = columnTasks.findIndex((t) => t.id === overId)

  if (overIdx === -1) {
    return Number(columnTasks[columnTasks.length - 1].position) + 65536.0
  }

  if (overIdx === 0) {
    // Before first item
    return Number(columnTasks[0].position) / 2
  }

  // Between two items
  const prev = Number(columnTasks[overIdx - 1].position)
  const next = Number(columnTasks[overIdx].position)
  return (prev + next) / 2
}

export default function ProjectBoardPage() {
  const { id: workspaceId, projectId } = useParams() as { id: string; projectId: string }
  const { setCurrentProject, setCurrentBoard, currentBoard } = useProjectStore()
  const {
    tasks,
    setTasks,
    addTask,
    updateTask,
    removeTask,
    optimisticMoveTask,
    openDrawer,
    closeDrawer,
    activeTask,
    isDrawerOpen
  } = useTaskStore()
  const queryClient = useQueryClient()

  // ── Real-time hooks ──────────────────────────────────────────────────────
  const { isConnected } = useSocket()
  useProjectSocket({ projectId, enabled: !!projectId })
  const { onlineUserIds } = usePresence(isConnected)

  // ── Auto-open Task Drawer from URL Query Parameter ────────────────────────
  const searchParams = useSearchParams()
  const taskIdParam = searchParams.get('task')

  useEffect(() => {
    if (taskIdParam && tasks.length > 0) {
      const matchedTask = tasks.find((t) => t.id === taskIdParam)
      if (matchedTask && activeTask?.id !== taskIdParam) {
        openDrawer(matchedTask)
      }
    }
  }, [taskIdParam, tasks, activeTask?.id, openDrawer])

  const [newColumnName, setNewColumnName] = useState('')
  const [isAddingColumn, setIsAddingColumn] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [activeCardId, setActiveCardId] = useState<string | null>(null) // For DragOverlay
  const [isCreatingTask, setIsCreatingTask] = useState(false)

  // DnD sensors — require 8px movement to start drag (avoids accidental drags on click)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    })
  )

  // ── Fetch project details ────────────────────────────────────────────────
  const { data: res, isLoading, error, refetch } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => ProjectService.getProject(projectId),
    enabled: !!projectId
  })

  const project = res?.success ? res.data : null

  // ── Fetch all tasks for project ─────────────────────────────────────────
  const { data: tasksRes, refetch: refetchTasks } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => TaskService.listTasks(projectId),
    enabled: !!projectId
  })

  // Sync tasks into Zustand store
  useEffect(() => {
    if (tasksRes?.success) {
      setTasks(tasksRes.data)
    }
  }, [tasksRes, setTasks])

  // Sync project/board into Zustand store
  useEffect(() => {
    if (project) {
      setCurrentProject(project)
      if (project.boards && project.boards.length > 0) {
        const board = currentBoard
          ? project.boards.find((b) => b.id === currentBoard.id)
          : null
        setCurrentBoard(board || project.boards[0])
      } else {
        setCurrentBoard(null)
      }
    }
  }, [project, setCurrentProject, setCurrentBoard])

  // ── Create column ────────────────────────────────────────────────────────
  const createColumnMutation = useMutation({
    mutationFn: (name: string) => {
      if (!currentBoard) throw new Error('No active board')
      return ProjectService.createColumn(currentBoard.id, { name })
    },
    onSuccess: (data) => {
      if (data.success) {
        setNewColumnName('')
        setIsAddingColumn(false)
        refetch()
      } else {
        setErrorMsg(data.message || 'Failed to add column')
      }
    }
  })

  const handleAddColumnSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newColumnName.trim()) return
    setErrorMsg(null)
    createColumnMutation.mutate(newColumnName)
  }

  // ── Create task ──────────────────────────────────────────────────────────
  const handleTaskCreated = useCallback(
    async (title: string, columnId: string, boardId: string) => {
      if (!project) return
      setIsCreatingTask(true)
      try {
        const res = await TaskService.createTask(projectId, {
          title,
          columnId,
          boardId
        })
        if (res.success) {
          addTask(res.data)
          // Update task count in query cache
          queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
        } else {
          setErrorMsg(res.message || 'Failed to create task')
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to create task')
      } finally {
        setIsCreatingTask(false)
      }
    },
    [project, projectId, addTask, queryClient]
  )

  // ── Move task API call ───────────────────────────────────────────────────
  const moveTaskMutation = useMutation({
    mutationFn: ({ taskId, columnId, position }: { taskId: string; columnId: string; position: number }) =>
      TaskService.moveTask(taskId, { columnId, position }),
    onSuccess: (res) => {
      if (res.success) {
        updateTask(res.data)
      }
    },
    onError: () => {
      // On failure, re-fetch to revert optimistic update
      refetchTasks()
    }
  })

  // ── DnD Handlers ────────────────────────────────────────────────────────
  const handleDragStart = (event: DragStartEvent) => {
    setActiveCardId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCardId(null)
    const { active, over } = event

    if (!over || active.id === over.id) return

    const activeTaskId = active.id as string
    const overId = over.id as string

    // Determine target column
    let targetColumnId: string
    if (overId.startsWith('column-')) {
      // Dropped directly onto a column container
      targetColumnId = overId.replace('column-', '')
    } else {
      // Dropped onto another task card — find its column
      const overTask = tasks.find((t) => t.id === overId)
      if (!overTask || !overTask.columnId) return
      targetColumnId = overTask.columnId
    }

    const newPosition = computeNewPosition(tasks, overId.startsWith('column-') ? null : overId, activeTaskId, targetColumnId)

    // Find target column name for status update
    const targetColumn = activeBoard?.columns.find((c) => c.id === targetColumnId)
    const newStatus = targetColumn?.name || ''

    // Optimistic update
    optimisticMoveTask(activeTaskId, targetColumnId, newPosition, newStatus)

    // API call
    moveTaskMutation.mutate({
      taskId: activeTaskId,
      columnId: targetColumnId,
      position: newPosition
    })
  }

  // ── Loading / Error states ───────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '1rem' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: '3px solid var(--border-default)',
            borderTopColor: 'var(--accent-primary)',
            animation: 'spin 1s linear infinite'
          }}
        />
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Loading project…</span>
      </div>
    )
  }

  if (error || !res?.success || !project) {
    return (
      <div className="card-glass" style={{ padding: '3rem', textAlign: 'center', maxWidth: '500px', margin: '2rem auto' }}>
        <Info size={40} style={{ color: 'var(--color-error)', marginBottom: '1rem' }} />
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Failed to load project</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          {res?.message || 'This project might not exist or you do not have permission to view it.'}
        </p>
        <Link
          href={`/workspace/${workspaceId}`}
          style={{
            padding: '0.5rem 1rem',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: 600
          }}
        >
          Back to Workspace
        </Link>
      </div>
    )
  }

  const activeBoard = project.boards.find((b) => b.id === currentBoard?.id) || project.boards[0]
  const activeDragTask = activeCardId ? tasks.find((t) => t.id === activeCardId) : null

  // Column-keyed tasks map (for O(1) lookups inside each column)
  const tasksByColumn: Record<string, TaskWithDetails[]> = {}
  if (activeBoard) {
    for (const col of activeBoard.columns) {
      tasksByColumn[col.id] = tasks
        .filter((t) => t.columnId === col.id)
        .sort((a, b) => Number(a.position) - Number(b.position))
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>

        {/* ── Project Header ────────────────────────────────────────────── */}
        <div
          className="card-glass"
          style={{
            padding: '1.25rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.875rem',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', minWidth: 0 }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 800,
                flexShrink: 0,
                letterSpacing: '0.05em'
              }}
            >
              {project.identifier}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.125rem', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {project.name}
                </span>
                <span style={{ fontSize: '0.625rem', padding: '0.125rem 0.5rem', borderRadius: 'var(--radius-full)', background: 'rgba(99,102,241,0.1)', color: 'var(--accent-tertiary)', border: '1px solid rgba(99,102,241,0.2)', textTransform: 'capitalize', flexShrink: 0 }}>
                  {project.status.replace('_', ' ')}
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {project.description || 'No description provided.'}
              </span>
            </div>
          </div>

          {/* View switcher + Presence + Settings */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>

            {/* Online presence avatars */}
            {onlineUserIds.size > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {project.members
                    .filter((m) => onlineUserIds.has(m.userId))
                    .slice(0, 5)
                    .map((m, idx) => (
                      <div
                        key={m.userId}
                        title={`${m.user.name} — online`}
                        style={{
                          position: 'relative',
                          marginLeft: idx > 0 ? '-8px' : 0,
                          zIndex: 5 - idx
                        }}
                      >
                        <div
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            background: getColorFromString(m.user.name),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.5625rem',
                            fontWeight: 700,
                            color: '#ffffff',
                            border: '2px solid var(--bg-secondary)'
                          }}
                        >
                          {getInitials(m.user.name)}
                        </div>
                        {/* Green presence dot */}
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '1px',
                            right: '1px',
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            background: '#22c55e',
                            border: '1.5px solid var(--bg-secondary)'
                          }}
                        />
                      </div>
                    ))}
                </div>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  {onlineUserIds.size} online
                </span>
              </div>
            )}

            {/* Connection indicator */}
            <div
              title={isConnected ? 'Real-time connected' : 'Real-time disconnected'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.625rem',
                fontWeight: 600,
                color: isConnected ? '#22c55e' : 'var(--text-muted)',
                padding: '0.2rem 0.5rem',
                background: isConnected ? 'rgba(34,197,94,0.1)' : 'var(--bg-tertiary)',
                border: `1px solid ${isConnected ? 'rgba(34,197,94,0.25)' : 'var(--border-default)'}`,
                borderRadius: 'var(--radius-full)',
                transition: 'all 0.3s ease'
              }}
            >
              {isConnected ? <Wifi size={10} /> : <WifiOff size={10} />}
              {isConnected ? 'Live' : 'Offline'}
            </div>

            <div
              style={{
                display: 'flex',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                padding: '0.2rem'
              }}
            >
              <button
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.3rem 0.625rem',
                  background: 'var(--bg-secondary)', border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.75rem',
                  fontWeight: 600, cursor: 'pointer'
                }}
              >
                <LayoutGrid size={13} /> Board
              </button>
              <button
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.3rem 0.625rem',
                  background: 'transparent', border: 'none', color: 'var(--text-muted)',
                  fontSize: '0.75rem', fontWeight: 500, cursor: 'not-allowed'
                }}
              >
                <List size={13} /> List
              </button>
              <button
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.3rem 0.625rem',
                  background: 'transparent', border: 'none', color: 'var(--text-muted)',
                  fontSize: '0.75rem', fontWeight: 500, cursor: 'not-allowed'
                }}
              >
                <Calendar size={13} /> Timeline
              </button>
            </div>
            <Link
              href={`/workspace/${workspaceId}/project/${projectId}/settings`}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.45rem 0.75rem',
                background: 'var(--bg-tertiary)', border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', textDecoration: 'none',
                fontSize: '0.75rem', fontWeight: 600
              }}
            >
              <Settings size={13} /> Settings
            </Link>
          </div>
        </div>

        {errorMsg && (
          <div
            style={{
              padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              color: '#f87171', fontSize: '0.8125rem', flexShrink: 0
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* ── Kanban Board ─────────────────────────────────────────────── */}
        {activeBoard && (
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              overflowX: 'auto',
              paddingBottom: '1.5rem',
              alignItems: 'flex-start',
              flex: 1
            }}
          >
            {activeBoard.columns.map((col) => (
              <BoardColumnComponent
                key={col.id}
                column={col}
                boardId={activeBoard.id}
                tasks={tasksByColumn[col.id] || []}
                onRefresh={() => refetch()}
                onTaskClick={(task) => openDrawer(task)}
                onTaskCreated={handleTaskCreated}
                isCreatingTask={isCreatingTask}
              />
            ))}

            {/* Add Column */}
            {isAddingColumn ? (
              <form
                onSubmit={handleAddColumnSubmit}
                className="card-glass"
                style={{
                  width: '300px', minWidth: '300px', padding: '1rem',
                  display: 'flex', flexDirection: 'column', gap: '0.75rem',
                  borderRadius: 'var(--radius-lg)', flexShrink: 0
                }}
              >
                <input
                  type="text"
                  placeholder="Column title..."
                  autoFocus
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  disabled={createColumnMutation.isPending}
                  style={{
                    background: 'var(--bg-primary)', border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
                    padding: '0.5rem 0.75rem', fontSize: '0.875rem', outline: 'none', width: '100%'
                  }}
                />
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setIsAddingColumn(false)}
                    disabled={createColumnMutation.isPending}
                    style={{
                      padding: '0.375rem 0.75rem', background: 'transparent',
                      border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)',
                      color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createColumnMutation.isPending}
                    style={{
                      padding: '0.375rem 0.75rem',
                      background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                      border: 'none', borderRadius: 'var(--radius-md)', color: '#ffffff',
                      fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '0.25rem'
                    }}
                  >
                    {createColumnMutation.isPending && <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />}
                    {createColumnMutation.isPending ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setIsAddingColumn(true)}
                className="glass"
                style={{
                  width: '300px', minWidth: '300px', height: '52px',
                  border: '1px dashed var(--border-default)', borderRadius: 'var(--radius-lg)',
                  color: 'var(--text-muted)', fontSize: '0.8125rem', fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  cursor: 'pointer', transition: 'all 0.15s ease', flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-hover)'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-default)'
                  e.currentTarget.style.color = 'var(--text-muted)'
                }}
              >
                <Plus size={15} /> Add Column
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── DragOverlay (ghost card while dragging) ───────────────────── */}
      <DragOverlay>
        {activeDragTask ? (
          <div style={{ transform: 'rotate(2deg)', opacity: 0.9 }}>
            <TaskCard task={activeDragTask} onClick={() => {}} />
          </div>
        ) : null}
      </DragOverlay>

      {/* ── Task Details Drawer ───────────────────────────────────────── */}
      {isDrawerOpen && activeTask && activeBoard && (
        <TaskDrawer
          task={activeTask}
          columns={activeBoard.columns}
          projectMembers={project.members}
          onClose={closeDrawer}
          onTaskUpdated={(updated) => updateTask(updated)}
          onTaskDeleted={(taskId) => {
            removeTask(taskId)
            closeDrawer()
          }}
        />
      )}
    </DndContext>
  )
}
