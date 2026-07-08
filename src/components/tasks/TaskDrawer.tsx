'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TaskWithDetails, Comment, BoardColumn } from '@/types/project.types'
import { TaskService } from '@/services/task.service'
import { useTaskStore } from '@/store/task.store'
import { getInitials, getColorFromString, formatRelativeTime } from '@/lib/utils'
import { getSocket } from '@/lib/socket'
import {
  X,
  Flag,
  Calendar,
  User,
  Clock,
  Trash2,
  Send,
  ChevronDown,
  MessageSquare,
  CornerDownRight,
  Loader2,
  CheckCircle2
} from 'lucide-react'

const PRIORITY_OPTIONS = [
  { value: 'critical', label: 'Critical', color: '#ef4444' },
  { value: 'high', label: 'High', color: '#f97316' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'low', label: 'Low', color: '#22c55e' },
  { value: 'none', label: 'None', color: '#6b7280' }
] as const

interface TaskDrawerProps {
  task: TaskWithDetails
  columns: BoardColumn[]
  projectMembers: Array<{ userId: string; user: { id: string; name: string; email: string; avatarUrl: string | null } }>
  onClose: () => void
  onTaskUpdated: (task: TaskWithDetails) => void
  onTaskDeleted: (taskId: string) => void
}

// ─────────────────────────────────────────
// Comment Item
// ─────────────────────────────────────────
function CommentItem({
  comment,
  taskId,
  onReply
}: {
  comment: Comment
  taskId: string
  onReply: (parentId: string) => void
}) {
  const [showReplies, setShowReplies] = useState(true)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', gap: '0.625rem' }}>
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: getColorFromString(comment.author.name),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.5625rem',
            fontWeight: 700,
            color: '#ffffff',
            flexShrink: 0,
            marginTop: '2px'
          }}
        >
          {getInitials(comment.author.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {comment.author.name}
            </span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
              {formatRelativeTime(comment.createdAt)}
            </span>
          </div>
          <div
            style={{
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              background: 'var(--bg-tertiary)',
              borderRadius: '0 var(--radius-md) var(--radius-md) var(--radius-md)',
              padding: '0.5rem 0.75rem'
            }}
          >
            {comment.content}
          </div>
          <button
            onClick={() => onReply(comment.id)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.6875rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              marginTop: '0.25rem',
              padding: '0.125rem 0'
            }}
          >
            <CornerDownRight size={10} />
            Reply
          </button>
        </div>
      </div>

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div style={{ marginLeft: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderLeft: '2px solid var(--border-default)', paddingLeft: '0.75rem' }}>
          {comment.replies.map((reply) => (
            <div key={reply.id} style={{ display: 'flex', gap: '0.5rem' }}>
              <div
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: getColorFromString(reply.author.name),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.5rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  flexShrink: 0,
                  marginTop: '2px'
                }}
              >
                {getInitials(reply.author.name)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {reply.author.name}
                  </span>
                  <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
                    {formatRelativeTime(reply.createdAt)}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    background: 'var(--bg-tertiary)',
                    borderRadius: '0 var(--radius-md) var(--radius-md) var(--radius-md)',
                    padding: '0.375rem 0.625rem'
                  }}
                >
                  {reply.content}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────
// Main TaskDrawer
// ─────────────────────────────────────────
export function TaskDrawer({
  task,
  columns,
  projectMembers,
  onClose,
  onTaskUpdated,
  onTaskDeleted
}: TaskDrawerProps) {
  const queryClient = useQueryClient()
  const { updateTask } = useTaskStore()

  // Editable local state
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || '')
  const [priority, setPriority] = useState(task.priority)
  const [status, setStatus] = useState(task.status)
  const [dueDate, setDueDate] = useState(
    task.dueDate ? new Date(task.dueDate).toISOString().substring(0, 10) : ''
  )
  const [estimate, setEstimate] = useState<string>(
    task.estimate !== null && task.estimate !== undefined ? String(task.estimate) : ''
  )
  const [isSaving, setIsSaving] = useState(false)
  const [saveIndicator, setSaveIndicator] = useState<'idle' | 'saving' | 'saved'>('idle')

  // Comments
  const [commentText, setCommentText] = useState('')
  const [replyToId, setReplyToId] = useState<string | null>(null)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)

  // Typing indicator state
  const [typingUsers, setTypingUsers] = useState<Array<{ userId: string; name: string }>>([])
  const isTypingRef = React.useRef(false)
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  // Sync when task prop changes (e.g. after external update)
  useEffect(() => {
    setTitle(task.title)
    setDescription(task.description || '')
    setPriority(task.priority)
    setStatus(task.status)
    setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().substring(0, 10) : '')
    setEstimate(task.estimate !== null && task.estimate !== undefined ? String(task.estimate) : '')

    // Reset typing indicator state when switching tasks
    setTypingUsers([])
    isTypingRef.current = false
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
  }, [task.id])

  // Listen for socket events for typing indicator
  useEffect(() => {
    let s: any
    try {
      s = getSocket()
    } catch {
      return
    }

    const handleCommentTyping = ({ taskId, userId, name, isTyping }: { taskId: string; userId: string; name: string; isTyping: boolean }) => {
      if (taskId !== task.id) return
      setTypingUsers((prev) => {
        if (isTyping) {
          if (prev.some((u) => u.userId === userId)) return prev
          return [...prev, { userId, name }]
        } else {
          return prev.filter((u) => u.userId !== userId)
        }
      })
    }

    s.on('comment:typing', handleCommentTyping)

    return () => {
      s.off('comment:typing', handleCommentTyping)
      if (isTypingRef.current) {
        s.emit('comment:typing', { taskId: task.id, projectId: task.projectId, isTyping: false })
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [task.id, task.projectId])

  // Comments query
  const { data: commentsRes, refetch: refetchComments } = useQuery({
    queryKey: ['comments', task.id],
    queryFn: () => TaskService.listComments(task.id),
    enabled: true
  })
  const comments = commentsRes?.success ? commentsRes.data : []

  // Auto-save mutation
  const saveMutation = useMutation({
    mutationFn: (patch: Parameters<typeof TaskService.updateTask>[1]) =>
      TaskService.updateTask(task.id, patch),
    onSuccess: (res) => {
      if (res.success) {
        updateTask(res.data)
        onTaskUpdated(res.data)
        setSaveIndicator('saved')
        setTimeout(() => setSaveIndicator('idle'), 2000)
      }
    },
    onSettled: () => setIsSaving(false)
  })

  // Debounced save for title / description
  const saveTimerRef = React.useRef<NodeJS.Timeout | null>(null)
  const debouncedSave = useCallback(
    (patch: Parameters<typeof TaskService.updateTask>[1]) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      setIsSaving(true)
      setSaveIndicator('saving')
      saveTimerRef.current = setTimeout(() => {
        saveMutation.mutate(patch)
      }, 600)
    },
    [task.id]
  )

  // ── Field change handlers ──
  const handleTitleChange = (val: string) => {
    setTitle(val)
    if (val.trim()) debouncedSave({ title: val.trim() })
  }

  const handleDescriptionChange = (val: string) => {
    setDescription(val)
    debouncedSave({ description: val })
  }

  const handlePriorityChange = (val: typeof priority) => {
    setPriority(val)
    saveMutation.mutate({ priority: val })
  }

  const handleStatusChange = (val: string) => {
    setStatus(val)
    saveMutation.mutate({ status: val })
  }

  const handleDueDateChange = (val: string) => {
    setDueDate(val)
    saveMutation.mutate({ dueDate: val ? new Date(val).toISOString() : null })
  }

  const handleEstimateChange = (val: string) => {
    setEstimate(val)
    const num = parseFloat(val)
    if (!isNaN(num) || val === '') {
      debouncedSave({ estimate: val === '' ? null : num })
    }
  }

  // Delete task mutation
  const deleteMutation = useMutation({
    mutationFn: () => TaskService.deleteTask(task.id),
    onSuccess: (res) => {
      if (res.success) {
        onTaskDeleted(task.id)
        onClose()
      }
    }
  })

  // Comment text change with typing indicator emit
  const handleCommentTextChange = (val: string) => {
    setCommentText(val)

    let s: any
    try {
      s = getSocket()
    } catch {
      return
    }

    if (!isTypingRef.current && val.trim().length > 0) {
      isTypingRef.current = true
      s.emit('comment:typing', { taskId: task.id, projectId: task.projectId, isTyping: true })
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false
        s.emit('comment:typing', { taskId: task.id, projectId: task.projectId, isTyping: false })
      }
    }, 2000)
  }

  // Comment submission
  const handleCommentSubmit = async () => {
    if (!commentText.trim()) return
    setIsSubmittingComment(true)
    try {
      // Clear typing indicator instantly
      try {
        const s = getSocket()
        if (isTypingRef.current) {
          isTypingRef.current = false
          s.emit('comment:typing', { taskId: task.id, projectId: task.projectId, isTyping: false })
        }
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current)
        }
      } catch {}

      const res = await TaskService.createComment(task.id, {
        content: commentText.trim(),
        parentId: replyToId
      })
      if (res.success) {
        setCommentText('')
        setReplyToId(null)
        refetchComments()
        queryClient.invalidateQueries({ queryKey: ['tasks'] })
      }
    } finally {
      setIsSubmittingComment(false)
    }
  }

  // Backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  const priorityOption = PRIORITY_OPTIONS.find((p) => p.value === priority)

  const inputStyle: React.CSSProperties = {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    padding: '0.375rem 0.625rem',
    fontSize: '0.8125rem',
    outline: 'none',
    width: '100%',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s ease'
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '0.6875rem',
    fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '0.25rem',
    display: 'block'
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleBackdropClick}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(2px)',
          zIndex: 999,
          animation: 'fadeIn 0.15s ease'
        }}
      />

      {/* Drawer panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(520px, 95vw)',
          background: 'var(--bg-secondary)',
          borderLeft: '1px solid var(--border-default)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.2s ease',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.3)'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border-default)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                color: 'var(--accent-primary)',
                fontFamily: 'var(--font-mono, monospace)',
                background: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.2)',
                padding: '0.125rem 0.5rem',
                borderRadius: 'var(--radius-full)'
              }}
            >
              {task.identifier}
            </span>
            {/* Save indicator */}
            <span
              style={{
                fontSize: '0.6875rem',
                color:
                  saveIndicator === 'saving'
                    ? 'var(--text-muted)'
                    : saveIndicator === 'saved'
                    ? '#22c55e'
                    : 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                transition: 'all 0.2s ease'
              }}
            >
              {saveIndicator === 'saving' && (
                <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} />
              )}
              {saveIndicator === 'saved' && <CheckCircle2 size={10} />}
              {saveIndicator === 'saving' ? 'Saving...' : saveIndicator === 'saved' ? 'Saved' : ''}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => {
                if (confirm(`Delete task "${task.title}"? This cannot be undone.`)) {
                  deleteMutation.mutate()
                }
              }}
              disabled={deleteMutation.isPending}
              title="Delete task"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-error)',
                cursor: 'pointer',
                padding: '0.375rem',
                borderRadius: 'var(--radius-sm)',
                display: 'flex'
              }}
            >
              <Trash2 size={14} />
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '0.375rem',
                borderRadius: 'var(--radius-sm)',
                display: 'flex'
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
          {/* Title */}
          <textarea
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Task title..."
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '1.125rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
              resize: 'none',
              lineHeight: 1.4,
              marginBottom: '1.25rem',
              minHeight: '2rem'
            }}
            onInput={(e) => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = `${el.scrollHeight}px`
            }}
            rows={1}
          />

          {/* Meta fields grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.875rem',
              marginBottom: '1.25rem',
              padding: '1rem',
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)'
            }}
          >
            {/* Priority */}
            <div>
              <label style={labelStyle}>
                <Flag size={9} style={{ display: 'inline', marginRight: '0.25rem' }} />
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => handlePriorityChange(e.target.value as typeof priority)}
                style={{
                  ...inputStyle,
                  color: priorityOption?.color,
                  fontWeight: 600
                }}
              >
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status / Column */}
            <div>
              <label style={labelStyle}>
                Status
              </label>
              <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value)}
                style={inputStyle}
              >
                {columns.map((col) => (
                  <option key={col.id} value={col.name}>
                    {col.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Due date */}
            <div>
              <label style={labelStyle}>
                <Calendar size={9} style={{ display: 'inline', marginRight: '0.25rem' }} />
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => handleDueDateChange(e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* Estimate */}
            <div>
              <label style={labelStyle}>
                <Clock size={9} style={{ display: 'inline', marginRight: '0.25rem' }} />
                Estimate (h)
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={estimate}
                onChange={(e) => handleEstimateChange(e.target.value)}
                placeholder="—"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Assignees */}
          {task.assignees.length > 0 && (
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={labelStyle}>
                <User size={9} style={{ display: 'inline', marginRight: '0.25rem' }} />
                Assignees
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                {task.assignees.map((a) => (
                  <div
                    key={a.userId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      padding: '0.25rem 0.625rem 0.25rem 0.25rem',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}
                  >
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: getColorFromString(a.user.name),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.5rem',
                        fontWeight: 700,
                        color: '#ffffff'
                      }}
                    >
                      {getInitials(a.user.name)}
                    </div>
                    {a.user.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={labelStyle}>Description</label>
            <textarea
              value={description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="Add a description... (supports plain text)"
              style={{
                ...inputStyle,
                resize: 'vertical',
                minHeight: '120px',
                lineHeight: 1.6,
                padding: '0.75rem'
              }}
            />
          </div>

          {/* Comments section */}
          <div>
            <label style={{ ...labelStyle, marginBottom: '0.75rem' }}>
              <MessageSquare size={9} style={{ display: 'inline', marginRight: '0.25rem' }} />
              Activity & Comments
            </label>

            {/* Comment list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
              {comments.length === 0 ? (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                comments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    taskId={task.id}
                    onReply={(parentId) => {
                      setReplyToId(parentId)
                      setCommentText('')
                    }}
                  />
                ))
              )}
            </div>

            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  fontStyle: 'italic',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem'
                }}
              >
                <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                  <span className="animate-typing-blink" style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor' }} />
                  <span className="animate-typing-blink" style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor', animationDelay: '0.2s' }} />
                  <span className="animate-typing-blink" style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor', animationDelay: '0.4s' }} />
                </div>
                <span>
                  {typingUsers.map((u) => u.name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Comment input — fixed at bottom */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderTop: '1px solid var(--border-default)',
            flexShrink: 0,
            background: 'var(--bg-secondary)'
          }}
        >
          {replyToId && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.6875rem',
                color: 'var(--accent-primary)',
                marginBottom: '0.5rem',
                padding: '0.25rem 0.5rem',
                background: 'rgba(99,102,241,0.08)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(99,102,241,0.15)'
              }}
            >
              <span>Replying to comment</span>
              <button
                onClick={() => setReplyToId(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)' }}
              >
                <X size={10} />
              </button>
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
            <textarea
              value={commentText}
              onChange={(e) => handleCommentTextChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleCommentSubmit()
                }
              }}
              placeholder={replyToId ? 'Write a reply...' : 'Write a comment... (Enter to send)'}
              rows={1}
              style={{
                ...inputStyle,
                resize: 'none',
                flex: 1,
                minHeight: '2.25rem',
                maxHeight: '120px',
                lineHeight: 1.5
              }}
              onInput={(e) => {
                const el = e.currentTarget
                el.style.height = 'auto'
                el.style.height = `${Math.min(el.scrollHeight, 120)}px`
              }}
            />
            <button
              onClick={handleCommentSubmit}
              disabled={isSubmittingComment || !commentText.trim()}
              style={{
                padding: '0.5rem',
                background: commentText.trim()
                  ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))'
                  : 'var(--bg-tertiary)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                color: commentText.trim() ? '#ffffff' : 'var(--text-muted)',
                cursor: commentText.trim() ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.15s ease'
              }}
            >
              {isSubmittingComment ? (
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Send size={14} />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default TaskDrawer
