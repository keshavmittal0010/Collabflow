'use client'

import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TaskWithDetails } from '@/types/project.types'
import { getInitials, getColorFromString, formatDate } from '@/lib/utils'
import { MessageSquare, Paperclip, AlertCircle, CalendarDays } from 'lucide-react'

const PRIORITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#22c55e',
  none: '#6b7280'
}

const PRIORITY_LABELS: Record<string, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  none: 'None'
}

interface TaskCardProps {
  task: TaskWithDetails
  onClick: () => void
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id, data: { task } })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    cursor: isDragging ? 'grabbing' : 'grab'
  }

  const priorityColor = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.none

  // Due date state
  const now = new Date()
  const dueDate = task.dueDate ? new Date(task.dueDate) : null
  const isOverdue = dueDate ? dueDate < now && !task.completedAt : false
  const isDueToday =
    dueDate
      ? dueDate.toDateString() === now.toDateString()
      : false

  const dueDateColor = isOverdue
    ? '#ef4444'
    : isDueToday
    ? '#f59e0b'
    : 'var(--text-muted)'

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        // Don't open drawer if it was a drag
        if (!isDragging) {
          e.stopPropagation()
          onClick()
        }
      }}
    >
      <div
        className="task-card"
        style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-default)',
          borderLeft: `3px solid ${priorityColor}`,
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          transition: 'border-color 0.15s ease, background 0.15s ease',
          userSelect: 'none'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-hover)'
          e.currentTarget.style.background = 'var(--bg-secondary)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-default)'
          e.currentTarget.style.background = 'var(--bg-primary)'
        }}
      >
        {/* Top row: identifier + priority badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <span
            style={{
              fontSize: '0.6875rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono, monospace)',
              letterSpacing: '0.02em'
            }}
          >
            {task.identifier}
          </span>
          <span
            style={{
              fontSize: '0.625rem',
              fontWeight: 700,
              color: priorityColor,
              background: `${priorityColor}18`,
              border: `1px solid ${priorityColor}30`,
              borderRadius: 'var(--radius-full)',
              padding: '0.0625rem 0.375rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              flexShrink: 0
            }}
          >
            {PRIORITY_LABELS[task.priority]}
          </span>
        </div>

        {/* Task title */}
        <span
          style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {task.title}
        </span>

        {/* Bottom row: assignees + due date + counts */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginTop: '0.125rem' }}>
          {/* Assignee avatars (stacked) */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {task.assignees.slice(0, 3).map((assignee, idx) => (
              <div
                key={assignee.userId}
                title={assignee.user.name}
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: getColorFromString(assignee.user.name),
                  border: '1.5px solid var(--bg-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.5rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  marginLeft: idx > 0 ? '-6px' : 0,
                  zIndex: 3 - idx,
                  position: 'relative',
                  flexShrink: 0
                }}
              >
                {getInitials(assignee.user.name)}
              </div>
            ))}
            {task.assignees.length > 3 && (
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: 'var(--bg-tertiary)',
                  border: '1.5px solid var(--bg-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.5rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginLeft: '-6px',
                  position: 'relative',
                  flexShrink: 0
                }}
              >
                +{task.assignees.length - 3}
              </div>
            )}
          </div>

          {/* Metadata: due date + comment + attachment counts */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {dueDate && (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  fontSize: '0.625rem',
                  fontWeight: 600,
                  color: dueDateColor
                }}
              >
                {isOverdue && <AlertCircle size={9} />}
                {!isOverdue && <CalendarDays size={9} />}
                {formatDate(dueDate, { month: 'short', day: 'numeric' })}
              </span>
            )}

            {task._count.comments > 0 && (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  fontSize: '0.625rem',
                  color: 'var(--text-muted)'
                }}
              >
                <MessageSquare size={9} />
                {task._count.comments}
              </span>
            )}

            {task._count.attachments > 0 && (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  fontSize: '0.625rem',
                  color: 'var(--text-muted)'
                }}
              >
                <Paperclip size={9} />
                {task._count.attachments}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TaskCard
