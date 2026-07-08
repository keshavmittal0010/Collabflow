'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Plus, Loader2 } from 'lucide-react'

interface TaskCreateInlineProps {
  columnId: string
  boardId: string
  projectId: string
  onTaskCreated: (title: string, columnId: string, boardId: string) => Promise<void>
  isLoading?: boolean
}

export function TaskCreateInline({
  columnId,
  boardId,
  projectId,
  onTaskCreated,
  isLoading = false
}: TaskCreateInlineProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [title, setTitle] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isExpanded])

  const handleSubmit = async () => {
    const trimmed = title.trim()
    if (!trimmed) return
    try {
      await onTaskCreated(trimmed, columnId, boardId)
      setTitle('')
      setIsExpanded(false)
    } catch {
      // Error handling done in parent
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === 'Escape') {
      setTitle('')
      setIsExpanded(false)
    }
  }

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          padding: '0.5rem 0.375rem',
          width: '100%',
          background: 'transparent',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text-muted)',
          fontSize: '0.75rem',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'color 0.15s ease, background 0.15s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--bg-tertiary)'
          e.currentTarget.style.color = 'var(--text-secondary)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = 'var(--text-muted)'
        }}
      >
        <Plus size={12} />
        Add task
      </button>
    )
  }

  return (
    <div
      style={{
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--accent-primary)',
        background: 'var(--bg-primary)',
        padding: '0.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.375rem',
        boxShadow: '0 0 0 3px rgba(99,102,241,0.1)'
      }}
    >
      <textarea
        ref={inputRef}
        value={title}
        onChange={(e) => {
          setTitle(e.target.value)
          // Auto-resize
          e.target.style.height = 'auto'
          e.target.style.height = `${e.target.scrollHeight}px`
        }}
        onKeyDown={handleKeyDown}
        placeholder="Task title... (Enter to create, Esc to cancel)"
        disabled={isLoading}
        rows={2}
        style={{
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: 'var(--text-primary)',
          fontSize: '0.8125rem',
          fontWeight: 500,
          resize: 'none',
          width: '100%',
          fontFamily: 'inherit',
          lineHeight: 1.4,
          minHeight: '2.5rem'
        }}
      />
      <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => {
            setTitle('')
            setIsExpanded(false)
          }}
          disabled={isLoading}
          style={{
            padding: '0.25rem 0.625rem',
            background: 'transparent',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-secondary)',
            fontSize: '0.6875rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading || !title.trim()}
          style={{
            padding: '0.25rem 0.75rem',
            background: title.trim()
              ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))'
              : 'var(--bg-tertiary)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            color: title.trim() ? '#ffffff' : 'var(--text-muted)',
            fontSize: '0.6875rem',
            fontWeight: 700,
            cursor: title.trim() ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            transition: 'all 0.15s ease'
          }}
        >
          {isLoading ? <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} /> : null}
          {isLoading ? 'Creating...' : 'Create'}
        </button>
      </div>
    </div>
  )
}

export default TaskCreateInline
