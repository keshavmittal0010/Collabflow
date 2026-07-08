'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { NotificationService, Notification } from '@/services/notification.service'
import { useWorkspaceStore } from '@/store/workspace.store'
import { getSocket } from '@/lib/socket'
import {
  Bell,
  Check,
  CheckCheck,
  MessageSquare,
  UserPlus,
  AtSign,
  Info,
  Loader2,
  ExternalLink
} from 'lucide-react'

export function NotificationCenter() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { currentWorkspace } = useWorkspaceStore()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  // Fetch notifications
  const { data: res, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await NotificationService.listNotifications(15, 0)
      return res.success ? res.data : { notifications: [], unreadCount: 0 }
    },
    refetchInterval: 60000 // fallback polling every 60s
  })

  const notifications = res?.notifications || []
  const unreadCount = res?.unreadCount || 0

  // Register real-time socket updates for new notifications
  useEffect(() => {
    let s: any
    try {
      s = getSocket()
    } catch {
      return
    }

    const handleNewNotification = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }

    s.on('notification:new', handleNewNotification)
    return () => {
      s.off('notification:new', handleNewNotification)
    }
  }, [queryClient])

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Mark all read mutation
  const markAllReadMutation = useMutation({
    mutationFn: () => NotificationService.markAllRead(currentWorkspace?.id),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ['notifications'] })
      }
    }
  })

  // Mark single read mutation
  const markReadMutation = useMutation({
    mutationFn: (id: string) => NotificationService.markRead(id, true),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ['notifications'] })
      }
    }
  })

  const handleNotificationClick = async (notif: Notification) => {
    setIsOpen(false)
    if (!notif.isRead) {
      markReadMutation.mutate(notif.id)
    }
    if (notif.actionUrl) {
      router.push(notif.actionUrl)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return <UserPlus size={14} style={{ color: 'var(--accent-primary)' }} />
      case 'comment_added':
        return <MessageSquare size={14} style={{ color: 'var(--accent-tertiary)' }} />
      case 'mention':
        return <AtSign size={14} style={{ color: '#ec4899' }} />
      default:
        return <Info size={14} style={{ color: 'var(--text-muted)' }} />
    }
  }

  const relativeTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      const now = new Date()
      const diff = now.getTime() - d.getTime()
      if (diff < 60000) return 'Just now'
      const mins = Math.floor(diff / 60000)
      if (mins < 60) return `${mins}m ago`
      const hrs = Math.floor(mins / 60)
      if (hrs < 24) return `${hrs}h ago`
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    } catch {
      return ''
    }
  }

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      {/* Navbar trigger Bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'transparent',
          border: 'none',
          color: isOpen ? 'var(--text-primary)' : 'var(--text-secondary)',
          cursor: 'pointer',
          padding: '0.5rem',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          transition: 'all 0.2s'
        }}
        className="glass-hover"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              minWidth: '15px',
              height: '15px',
              borderRadius: '50%',
              background: 'var(--color-error)',
              color: '#ffffff',
              fontSize: '9px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2.5px solid var(--bg-secondary)',
              boxShadow: '0 0 10px rgba(239, 68, 68, 0.4)'
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </button>

      {/* Floating notifications dropdown center */}
      {isOpen && (
        <div
          className="card-glass shadow-strong animate-scaleIn"
          style={{
            position: 'absolute',
            top: '42px',
            right: 0,
            width: '320px',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-default)',
            zIndex: 100,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '400px'
          }}
        >
          {/* Header controls */}
          <div
            style={{
              padding: '0.875rem 1rem',
              borderBottom: '1px solid var(--border-default)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0
            }}
          >
            <span style={{ fontSize: '0.8125rem', fontWeight: 800 }}>Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--accent-primary)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '2px 4px',
                  borderRadius: '4px'
                }}
                className="glass-hover"
              >
                {markAllReadMutation.isPending ? (
                  <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <>
                    <CheckCheck size={12} /> Mark all read
                  </>
                )}
              </button>
            )}
          </div>

          {/* Timeline Feed */}
          <div className="scroll-area" style={{ flex: 1, padding: '0.5rem 0' }}>
            {isLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-muted)' }} />
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1.5rem', color: 'var(--text-muted)' }}>
                <Bell size={24} style={{ opacity: 0.2, margin: '0 auto 0.5rem' }} />
                <p style={{ fontSize: '0.75rem' }}>All caught up! No notifications.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    cursor: 'pointer',
                    background: notif.isRead ? 'transparent' : 'rgba(99,102,241,0.03)',
                    borderLeft: `3px solid ${notif.isRead ? 'transparent' : 'var(--accent-primary)'}`,
                    transition: 'all 0.15s'
                  }}
                  className="glass-hover"
                >
                  {/* Icon */}
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-default)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {getNotificationIcon(notif.type)}
                  </div>

                  {/* Content block */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem', minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: notif.isRead ? 600 : 700, color: 'var(--text-primary)' }}>
                        {notif.title}
                      </span>
                      <span style={{ fontSize: '0.5625rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                        {relativeTime(notif.createdAt)}
                      </span>
                    </div>
                    {notif.body && (
                      <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {notif.body}
                      </p>
                    )}
                  </div>
                  
                  {/* Single mark read check */}
                  {!notif.isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        markReadMutation.mutate(notif.id)
                      }}
                      title="Mark as read"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        alignSelf: 'center',
                        display: 'flex',
                        borderRadius: '4px'
                      }}
                      className="glass-hover"
                    >
                      <Check size={12} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
export default NotificationCenter
