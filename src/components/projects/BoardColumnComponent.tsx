'use client'

import React, { useState } from 'react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { BoardColumn, TaskWithDetails } from '@/types/project.types'
import { ProjectService } from '@/services/project.service'
import { TaskCard } from '@/components/tasks/TaskCard'
import { TaskCreateInline } from '@/components/tasks/TaskCreateInline'
import { Trash, Edit3, Check, X, Plus } from 'lucide-react'

interface BoardColumnProps {
  column: BoardColumn
  boardId: string
  tasks: TaskWithDetails[]
  onRefresh: () => void
  onTaskClick: (task: TaskWithDetails) => void
  onTaskCreated: (title: string, columnId: string, boardId: string) => Promise<void>
  isCreatingTask?: boolean
}

export function BoardColumnComponent({
  column,
  boardId,
  tasks,
  onRefresh,
  onTaskClick,
  onTaskCreated,
  isCreatingTask = false
}: BoardColumnProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(column.name)
  const [color, setColor] = useState(column.color || '#6366f1')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Make this column a droppable zone for dnd-kit
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `column-${column.id}`,
    data: { columnId: column.id, columnName: column.name }
  })

  const handleRename = async () => {
    if (!name.trim()) return
    setIsSubmitting(true)
    try {
      const res = await ProjectService.updateColumn(boardId, column.id, { name, color })
      if (res.success) {
        setIsEditing(false)
        onRefresh()
      }
    } catch (err) {
      console.error('Rename column error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete the column "${column.name}"?`)) {
      try {
        const res = await ProjectService.deleteColumn(boardId, column.id)
        if (res.success) {
          onRefresh()
        }
      } catch (err) {
        console.error('Delete column error:', err)
      }
    }
  }

  const taskIds = tasks.map((t) => t.id)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '300px',
        minWidth: '300px',
        background: 'var(--bg-secondary)',
        border: `1px solid ${isOver ? 'var(--accent-primary)' : 'var(--border-default)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: '1rem',
        maxHeight: 'calc(100vh - 220px)',
        alignSelf: 'flex-start',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        boxShadow: isOver ? '0 0 0 2px rgba(99,102,241,0.2)' : 'none'
      }}
    >
      {/* Column Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem', flexShrink: 0 }}>
        {isEditing ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', width: '100%' }}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-hover)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                padding: '0.25rem 0.5rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                outline: 'none',
                flex: 1
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename()
                if (e.key === 'Escape') setIsEditing(false)
              }}
              autoFocus
            />
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              disabled={isSubmitting}
              style={{ width: '18px', height: '18px', border: 'none', borderRadius: '50%', cursor: 'pointer', background: 'transparent', padding: 0 }}
            />
            <button
              onClick={handleRename}
              disabled={isSubmitting}
              style={{ background: 'transparent', border: 'none', color: 'var(--color-success)', cursor: 'pointer', padding: '2px' }}
            >
              <Check size={14} />
            </button>
            <button
              onClick={() => setIsEditing(false)}
              disabled={isSubmitting}
              style={{ background: 'transparent', border: 'none', color: 'var(--color-error)', cursor: 'pointer', padding: '2px' }}
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, width: '100%' }}>
            {/* Color dot */}
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: column.color || 'var(--accent-primary)',
                flexShrink: 0
              }}
            />
            <span
              style={{
                fontSize: '0.8125rem',
                fontWeight: 700,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
                color: 'var(--text-primary)'
              }}
            >
              {column.name}
            </span>

            {/* Task Count Badge */}
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                background: 'var(--bg-tertiary)',
                color: 'var(--text-muted)',
                padding: '0.0625rem 0.375rem',
                borderRadius: 'var(--radius-full)',
                flexShrink: 0,
                minWidth: '20px',
                textAlign: 'center'
              }}
            >
              {tasks.length}
            </span>

            {/* Column Actions */}
            <div style={{ display: 'flex', gap: '0.125rem', flexShrink: 0 }} className="column-actions">
              <button
                onClick={() => setIsEditing(true)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', borderRadius: 'var(--radius-sm)' }}
              >
                <Edit3 size={11} />
              </button>
              <button
                onClick={handleDelete}
                style={{ background: 'transparent', border: 'none', color: 'var(--color-error)', cursor: 'pointer', padding: '2px', borderRadius: 'var(--radius-sm)', opacity: 0.6 }}
              >
                <Trash size={11} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Task list drop zone */}
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setDropRef}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            flex: 1,
            overflowY: 'auto',
            minHeight: '60px',
            borderRadius: 'var(--radius-md)',
            padding: tasks.length === 0 ? '1rem' : '0.25rem 0',
            background: isOver && tasks.length === 0 ? 'rgba(99,102,241,0.05)' : 'transparent',
            transition: 'background 0.15s ease',
            scrollbarWidth: 'thin'
          }}
        >
          {tasks.length === 0 && !isOver && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.75rem',
                fontStyle: 'italic',
                height: '60px',
                border: '1px dashed var(--border-default)',
                borderRadius: 'var(--radius-md)'
              }}
            >
              Drop tasks here
            </div>
          )}
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
            />
          ))}
        </div>
      </SortableContext>

      {/* Inline Task Create */}
      <div style={{ marginTop: '0.5rem', flexShrink: 0 }}>
        <TaskCreateInline
          columnId={column.id}
          boardId={boardId}
          projectId=""
          onTaskCreated={onTaskCreated}
          isLoading={isCreatingTask}
        />
      </div>
    </div>
  )
}

export default BoardColumnComponent
