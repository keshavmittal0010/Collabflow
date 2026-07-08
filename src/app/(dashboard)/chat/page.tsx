'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useWorkspaceStore } from '@/store/workspace.store'
import { useAuthStore } from '@/store/auth.store'
import { useChatStore } from '@/store/chat.store'
import { ChatService } from '@/services/chat.service'
import { useChatSocket } from '@/hooks/useChatSocket'
import { getSocket } from '@/lib/socket'
import { ChannelModal } from '@/components/chat/ChannelModal'
import { getInitials, getColorFromString, formatRelativeTime } from '@/lib/utils'
import {
  Hash,
  Lock,
  Plus,
  Send,
  MessageSquare,
  Smile,
  X,
  User,
  Users,
  Loader2,
  FolderOpen,
  ArrowRight,
  ChevronRight,
  CornerDownRight,
  Settings
} from 'lucide-react'

// Emojis list for reactions
const EMOJIS = ['👍', '❤️', '🔥', '😂', '🎉', '🚀', '👀', '✅']

export default function ChatPage() {
  const queryClient = useQueryClient()
  const { currentWorkspace } = useWorkspaceStore()
  const { user: currentUser } = useAuthStore()
  const {
    channels,
    setChannels,
    activeChannel,
    setActiveChannel,
    messages,
    setMessages,
    activeThreadParent,
    setActiveThreadParent,
    threadMessages,
    typingUsers
  } = useChatStore()

  // UI state
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [threadMessageText, setThreadMessageText] = useState('')
  const [activeReactionMenuId, setActiveReactionMenuId] = useState<string | null>(null)
  
  // Sockets connections
  useChatSocket({ channelId: activeChannel?.id, enabled: !!activeChannel?.id })

  // Refs for typing state
  const isTypingRef = useRef(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const chatEndRef = useRef<HTMLDivElement | null>(null)
  const threadEndRef = useRef<HTMLDivElement | null>(null)

  // Query workspace members
  const workspaceId = currentWorkspace?.id
  const { data: membersRes } = useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}`)
      return res.json()
    },
    enabled: !!workspaceId
  })
  const workspaceMembers = membersRes?.success ? membersRes.data.members : []

  // Fetch channels list when workspace changes
  const { isLoading: isChannelsLoading } = useQuery({
    queryKey: ['channels', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return []
      const res = await ChatService.listChannels(workspaceId)
      if (res.success) {
        setChannels(res.data)
        // Auto-select first public channel if none selected
        if (res.data.length > 0 && !activeChannel) {
          const general = res.data.find((c) => c.name === 'general') || res.data[0]
          setActiveChannel(general)
        }
      }
      return res.success ? res.data : []
    },
    enabled: !!workspaceId
  })

  // Fetch messages when active channel changes
  const { isLoading: isMessagesLoading } = useQuery({
    queryKey: ['messages', activeChannel?.id],
    queryFn: async () => {
      if (!activeChannel?.id) return []
      const res = await ChatService.listMessages(activeChannel.id)
      if (res.success) {
        setMessages(res.data)
      }
      return res.success ? res.data : []
    },
    enabled: !!activeChannel?.id
  })

  // Scroll to bottom of message list on updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeChannel?.id])

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [threadMessages, activeThreadParent?.id])

  // Clear typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    }
  }, [])

  if (!workspaceId) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          textAlign: 'center',
          gap: '1rem',
          padding: '2rem'
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'rgba(99, 102, 241, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-primary)',
            fontSize: '28px',
            boxShadow: 'var(--shadow-glow)'
          }}
        >
          📁
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>No Workspace Selected</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '400px' }}>
          Please select or create a workspace using the switcher on the sidebar to access team chat channels.
        </p>
      </div>
    )
  }

  // Handle local message text changes with typing indicators
  const handleMessageChange = (val: string) => {
    setMessageText(val)

    if (!activeChannel?.id) return
    let s: any
    try {
      s = getSocket()
    } catch {
      return
    }

    if (!isTypingRef.current && val.trim().length > 0) {
      isTypingRef.current = true
      s.emit('message:typing', { channelId: activeChannel.id, isTyping: true })
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false
        s.emit('message:typing', { channelId: activeChannel.id, isTyping: false })
      }
    }, 2000)
  }

  // Send message submit
  const handleSendMessage = async () => {
    if (!messageText.trim() || !activeChannel?.id) return

    // Reset typing triggers
    try {
      const s = getSocket()
      if (isTypingRef.current) {
        isTypingRef.current = false
        s.emit('message:typing', { channelId: activeChannel.id, isTyping: false })
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    } catch {}

    const text = messageText.trim()
    setMessageText('')

    try {
      const res = await ChatService.sendMessage(activeChannel.id, {
        content: text,
        parentId: null
      })
      if (!res.success) {
        console.error('Send message error:', res.message)
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Send thread reply submit
  const handleSendThreadReply = async () => {
    if (!threadMessageText.trim() || !activeChannel?.id || !activeThreadParent?.id) return

    const text = threadMessageText.trim()
    setThreadMessageText('')

    try {
      const res = await ChatService.sendMessage(activeChannel.id, {
        content: text,
        parentId: activeThreadParent.id
      })
      if (!res.success) {
        console.error('Send reply error:', res.message)
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Handle emoji reaction click
  const handleReactionClick = async (messageId: string, emoji: string) => {
    setActiveReactionMenuId(null)
    try {
      const res = await ChatService.toggleReaction(messageId, emoji)
      if (!res.success) {
        console.error('Toggle reaction error:', res.message)
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Trigger or create direct message thread with a workspace member
  const handleDMOpen = async (targetUser: any) => {
    if (targetUser.id === currentUser?.id) return

    // Format a standard private DM name based on user ids
    const dmName = `dm-${[currentUser?.id, targetUser.id].sort().join('-')}`
    
    // Check if channel already exists
    const existing = channels.find((c) => c.name === dmName)
    if (existing) {
      setActiveChannel(existing)
      return
    }

    // Create channel
    try {
      const res = await ChatService.createChannel(workspaceId, {
        name: dmName,
        type: 'private',
        description: `Direct message thread between you and ${targetUser.name}`,
        memberIds: [targetUser.id]
      })
      if (res.success) {
        setActiveChannel(res.data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Get active channel display name
  const getChannelDisplayName = (c: any) => {
    if (!c) return ''
    if (c.name.startsWith('dm-')) {
      const otherMember = c.members?.find((m: any) => m.userId !== currentUser?.id)
      return otherMember?.user.name || 'Direct Message'
    }
    return c.name
  }

  // Render direct message members switcher
  const dmChannels = channels.filter((c) => c.name.startsWith('dm-'))
  const standardChannels = channels.filter((c) => !c.name.startsWith('dm-'))
  const publicChannels = standardChannels.filter((c) => c.type === 'public')
  const privateChannels = standardChannels.filter((c) => c.type === 'private')

  const channelTypingUsers = activeChannel?.id ? typingUsers[activeChannel.id] || [] : []

  return (
    <div
      style={{
        display: 'flex',
        height: 'calc(100vh - var(--navbar-height) - 4rem)',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)'
      }}
    >
      {/* 1. Left Chat Sidebar Switcher */}
      <div
        style={{
          width: '260px',
          borderRight: '1px solid var(--border-default)',
          background: 'var(--bg-primary)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem',
            borderBottom: '1px solid var(--border-default)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span style={{ fontWeight: 800, fontSize: '0.875rem' }}>Workspace Chat</span>
          <button
            onClick={() => setIsChannelModalOpen(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--accent-primary)',
              cursor: 'pointer',
              display: 'flex',
              padding: '0.25rem'
            }}
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Channels List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Public Channels */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', paddingLeft: '0.5rem', marginBottom: '0.375rem' }}>
              <span>Public Channels</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {publicChannels.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveChannel(c)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    width: '100%',
                    padding: '0.5rem 0.625rem',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    background: activeChannel?.id === c.id ? 'var(--bg-tertiary)' : 'transparent',
                    color: activeChannel?.id === c.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontSize: '0.8125rem',
                    fontWeight: activeChannel?.id === c.id ? 600 : 500,
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <Hash size={14} style={{ color: activeChannel?.id === c.id ? 'var(--accent-tertiary)' : 'var(--text-muted)' }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Private Channels */}
          {privateChannels.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', paddingLeft: '0.5rem', marginBottom: '0.375rem' }}>
                <span>Private Channels</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {privateChannels.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveChannel(c)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      width: '100%',
                      padding: '0.5rem 0.625rem',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      background: activeChannel?.id === c.id ? 'var(--bg-tertiary)' : 'transparent',
                      color: activeChannel?.id === c.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontSize: '0.8125rem',
                      fontWeight: activeChannel?.id === c.id ? 600 : 500,
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    <Lock size={13} style={{ color: activeChannel?.id === c.id ? 'var(--accent-tertiary)' : 'var(--text-muted)' }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Direct Messages switcher */}
          <div>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', paddingLeft: '0.5rem', marginBottom: '0.375rem' }}>
              <span>Workspace Members DMs</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {workspaceMembers
                .filter((m: any) => m.userId !== currentUser?.id)
                .map((member: any) => {
                  const dmName = `dm-${[currentUser?.id, member.userId].sort().join('-')}`
                  const isActive = activeChannel?.name === dmName
                  return (
                    <button
                      key={member.userId}
                      onClick={() => handleDMOpen(member.user)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        width: '100%',
                        padding: '0.5rem 0.625rem',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        background: isActive ? 'var(--bg-tertiary)' : 'transparent',
                        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontSize: '0.8125rem',
                        fontWeight: isActive ? 600 : 500,
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          background: getColorFromString(member.user.name),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.5625rem',
                          fontWeight: 700,
                          color: '#ffffff'
                        }}
                      >
                        {getInitials(member.user.name)}
                      </div>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {member.user.name}
                      </span>
                    </button>
                  )
                })}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Chat Panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-tertiary)', minWidth: 0 }}>
        {activeChannel ? (
          <>
            {/* Main Chat Header */}
            <div
              style={{
                height: '60px',
                borderBottom: '1px solid var(--border-default)',
                background: 'var(--bg-secondary)',
                padding: '0 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                {activeChannel.type === 'public' ? (
                  <Hash size={18} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                ) : activeChannel.name.startsWith('dm-') ? (
                  <User size={18} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                ) : (
                  <Lock size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                )}
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span style={{ fontSize: '0.9375rem', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {getChannelDisplayName(activeChannel)}
                  </span>
                  {activeChannel.description && (
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {activeChannel.description}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Channel Stats */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Users size={14} />
                  <span>{activeChannel.members?.length || 1}</span>
                </div>
              </div>
            </div>

            {/* Chat Timeline */}
            <div
              className="scroll-area"
              style={{
                flex: 1,
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                background: 'var(--bg-tertiary)'
              }}
            >
              {isMessagesLoading ? (
                <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-secondary)' }} />
                </div>
              ) : messages.length === 0 ? (
                <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '0.5rem' }}>
                  <MessageSquare size={36} style={{ opacity: 0.3 }} />
                  <span style={{ fontSize: '0.8125rem' }}>This is the start of # {getChannelDisplayName(activeChannel)} channel thread.</span>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const prevMsg = index > 0 ? messages[index - 1] : null
                  const isConsecutive =
                    prevMsg &&
                    prevMsg.authorId === msg.authorId &&
                    new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() < 120000

                  // Render reactions list
                  const groupedReactions = (msg.reactions || []).reduce((acc: any, curr: any) => {
                    if (!acc[curr.emoji]) acc[curr.emoji] = []
                    acc[curr.emoji].push(curr.userId)
                    return acc
                  }, {})

                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        gap: '0.75rem',
                        position: 'relative',
                        padding: '0.25rem 0.5rem',
                        marginLeft: '-0.5rem',
                        marginRight: '-0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        transition: 'background 0.15s',
                        marginTop: isConsecutive ? '-0.5rem' : '0'
                      }}
                      onMouseEnter={() => setActiveReactionMenuId(msg.id)}
                      onMouseLeave={() => setActiveReactionMenuId(null)}
                    >
                      {/* Floating actions menu */}
                      {activeReactionMenuId === msg.id && (
                        <div
                          className="card-glass shadow-sm"
                          style={{
                            position: 'absolute',
                            top: '-12px',
                            right: '1rem',
                            display: 'flex',
                            gap: '4px',
                            padding: '4px',
                            borderRadius: 'var(--radius-md)',
                            zIndex: 10
                          }}
                        >
                          {/* Emoji quick selects */}
                          {EMOJIS.slice(0, 4).map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => handleReactionClick(msg.id, emoji)}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                padding: '2px 4px',
                                borderRadius: '4px',
                                transition: 'all 0.1s'
                              }}
                              className="glass-hover"
                            >
                              {emoji}
                            </button>
                          ))}
                          <div style={{ width: '1px', background: 'var(--border-default)', margin: '0 2px' }} />
                          {/* Reply thread button */}
                          <button
                            onClick={() => setActiveThreadParent(msg)}
                            title="Reply in thread"
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              padding: '2px 4px',
                              borderRadius: '4px'
                            }}
                            className="glass-hover"
                          >
                            <MessageSquare size={13} />
                          </button>
                        </div>
                      )}

                      {/* Avatar */}
                      {!isConsecutive ? (
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: getColorFromString(msg.author.name),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            color: '#ffffff',
                            flexShrink: 0
                          }}
                        >
                          {getInitials(msg.author.name)}
                        </div>
                      ) : (
                        <div style={{ width: '36px', flexShrink: 0 }} /> // placeholder to align consecutive contents
                      )}

                      {/* Content block */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 0, flex: 1 }}>
                        {!isConsecutive && (
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.8125rem', fontWeight: 700 }}>{msg.author.name}</span>
                            <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
                              {formatRelativeTime(msg.createdAt)}
                            </span>
                          </div>
                        )}
                        <span style={{ fontSize: '0.8125rem', lineHeight: 1.5, color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                          {msg.content}
                        </span>

                        {/* Reactions chips */}
                        {Object.keys(groupedReactions).length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                            {Object.entries(groupedReactions).map(([emoji, userIds]: [string, any]) => {
                              const hasReacted = userIds.includes(currentUser?.id)
                              return (
                                <button
                                  key={emoji}
                                  onClick={() => handleReactionClick(msg.id, emoji)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '2px 6px',
                                    borderRadius: '12px',
                                    background: hasReacted ? 'rgba(99,102,241,0.08)' : 'var(--bg-secondary)',
                                    border: `1px solid ${hasReacted ? 'var(--accent-primary)' : 'var(--border-default)'}`,
                                    color: hasReacted ? 'var(--accent-tertiary)' : 'var(--text-secondary)',
                                    fontSize: '0.6875rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.1s'
                                  }}
                                >
                                  <span>{emoji}</span>
                                  <span style={{ fontWeight: 600 }}>{userIds.length}</span>
                                </button>
                              )
                            })}
                          </div>
                        )}

                        {/* Thread indicator replies link */}
                        {msg.replyCount && msg.replyCount > 0 && !activeThreadParent && (
                          <button
                            onClick={() => setActiveThreadParent(msg)}
                            style={{
                              alignSelf: 'flex-start',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--accent-primary)',
                              fontSize: '0.6875rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              padding: '2px 0',
                              marginTop: '2px'
                            }}
                          >
                            <CornerDownRight size={12} />
                            <span>{msg.replyCount} {msg.replyCount === 1 ? 'reply' : 'replies'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Main Chat Input footer */}
            <div
              style={{
                padding: '1rem 1.25rem',
                borderTop: '1px solid var(--border-default)',
                background: 'var(--bg-secondary)',
                flexShrink: 0
              }}
            >
              {/* Typing indicators */}
              {channelTypingUsers.length > 0 && (
                <div
                  style={{
                    fontSize: '0.6875rem',
                    color: 'var(--text-muted)',
                    fontStyle: 'italic',
                    marginBottom: '0.375rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <div style={{ display: 'flex', gap: '2px' }}>
                    <span className="animate-typing-blink" style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'currentColor' }} />
                    <span className="animate-typing-blink" style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'currentColor', animationDelay: '0.2s' }} />
                    <span className="animate-typing-blink" style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'currentColor', animationDelay: '0.4s' }} />
                  </div>
                  <span>
                    {channelTypingUsers.map((u) => u.name).join(', ')} {channelTypingUsers.length === 1 ? 'is' : 'are'} typing...
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                <textarea
                  value={messageText}
                  onChange={(e) => handleMessageChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  placeholder={`Message # ${getChannelDisplayName(activeChannel)}...`}
                  rows={1}
                  style={{
                    width: '100%',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    padding: '0.625rem 0.75rem',
                    fontSize: '0.875rem',
                    outline: 'none',
                    resize: 'none',
                    lineHeight: 1.5,
                    minHeight: '2.25rem',
                    maxHeight: '120px'
                  }}
                  onInput={(e) => {
                    const el = e.currentTarget
                    el.style.height = 'auto'
                    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim()}
                  style={{
                    padding: '0.5rem',
                    background: messageText.trim()
                      ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))'
                      : 'var(--bg-tertiary)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    color: messageText.trim() ? '#ffffff' : 'var(--text-muted)',
                    cursor: messageText.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifySelf: 'center', alignSelf: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '1rem' }}>
            <FolderOpen size={48} style={{ opacity: 0.2 }} />
            <span style={{ fontSize: '0.875rem' }}>Select a channel or DM member to start chatting!</span>
          </div>
        )}
      </div>

      {/* 3. Right Thread Side Drawer */}
      {activeThreadParent && (
        <div
          style={{
            width: '320px',
            borderLeft: '1px solid var(--border-default)',
            background: 'var(--bg-primary)',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            animation: 'slideInRight 0.3s ease forwards'
          }}
        >
          {/* Thread Header */}
          <div
            style={{
              height: '60px',
              padding: '0 1rem',
              borderBottom: '1px solid var(--border-default)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span style={{ fontSize: '0.875rem', fontWeight: 800 }}>Thread Details</span>
            <button
              onClick={() => setActiveThreadParent(null)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Original message details */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid var(--border-default)', paddingBottom: '1rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: getColorFromString(activeThreadParent.author.name),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  flexShrink: 0
                }}
              >
                {getInitials(activeThreadParent.author.name)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{activeThreadParent.author.name}</span>
                  <span style={{ fontSize: '0.5625rem', color: 'var(--text-muted)' }}>
                    {formatRelativeTime(activeThreadParent.createdAt)}
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', lineHeight: 1.4, color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                  {activeThreadParent.content}
                </span>
              </div>
            </div>

            {/* Replies timeline list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Replies
              </span>
              {threadMessages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  No replies yet.
                </div>
              ) : (
                threadMessages.map((reply) => (
                  <div key={reply.id} style={{ display: 'flex', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: getColorFromString(reply.author.name),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        color: '#ffffff',
                        flexShrink: 0
                      }}
                    >
                      {getInitials(reply.author.name)}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{reply.author.name}</span>
                        <span style={{ fontSize: '0.5625rem', color: 'var(--text-muted)' }}>
                          {formatRelativeTime(reply.createdAt)}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.75rem', lineHeight: 1.4, color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                        {reply.content}
                      </span>
                    </div>
                  </div>
                ))
              )}
              <div ref={threadEndRef} />
            </div>
          </div>

          {/* Thread input box */}
          <div
            style={{
              padding: '0.75rem 1rem',
              borderTop: '1px solid var(--border-default)',
              background: 'var(--bg-secondary)',
              flexShrink: 0
            }}
          >
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
              <textarea
                value={threadMessageText}
                onChange={(e) => setThreadMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendThreadReply()
                  }
                }}
                placeholder="Reply..."
                rows={1}
                style={{
                  width: '100%',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  padding: '0.5rem 0.625rem',
                  fontSize: '0.75rem',
                  outline: 'none',
                  resize: 'none',
                  lineHeight: 1.4,
                  minHeight: '2rem',
                  maxHeight: '80px'
                }}
                onInput={(e) => {
                  const el = e.currentTarget
                  el.style.height = 'auto'
                  el.style.height = `${Math.min(el.scrollHeight, 80)}px`
                }}
              />
              <button
                onClick={handleSendThreadReply}
                disabled={!threadMessageText.trim()}
                style={{
                  padding: '0.375rem 0.5rem',
                  background: threadMessageText.trim()
                    ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))'
                    : 'var(--bg-tertiary)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  color: threadMessageText.trim() ? '#ffffff' : 'var(--text-muted)',
                  cursor: threadMessageText.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Send size={13} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Channel Creation Modal */}
      <ChannelModal
        workspaceId={workspaceId}
        workspaceMembers={workspaceMembers}
        isOpen={isChannelModalOpen}
        onClose={() => setIsChannelModalOpen(false)}
        onSuccess={(newChan) => {
          setActiveChannel(newChan)
        }}
      />
    </div>
  )
}
