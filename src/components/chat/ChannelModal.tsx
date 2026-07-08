'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreateChannelSchema, CreateChannelSchemaType } from '@/lib/validations'
import { ChatService } from '@/services/chat.service'
import { useChatStore } from '@/store/chat.store'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, Lock, Hash, Loader2 } from 'lucide-react'

interface ChannelModalProps {
  workspaceId: string
  workspaceMembers: any[]
  isOpen: boolean
  onClose: () => void
  onSuccess?: (newChannel: any) => void
}

export function ChannelModal({
  workspaceId,
  workspaceMembers,
  isOpen,
  onClose,
  onSuccess
}: ChannelModalProps) {
  const { setChannels } = useChatStore()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<CreateChannelSchemaType>({
    resolver: zodResolver(CreateChannelSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'public',
      memberIds: []
    }
  })

  const channelType = watch('type')

  if (!isOpen) return null

  const handleMemberToggle = (uid: string) => {
    setSelectedMemberIds((prev) => {
      const next = prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
      setValue('memberIds', next)
      return next
    })
  }

  const onSubmit = async (data: CreateChannelSchemaType) => {
    setErrorMsg(null)
    setIsSubmitting(true)
    try {
      const res = await ChatService.createChannel(workspaceId, {
        ...data,
        memberIds: data.type === 'private' ? selectedMemberIds : []
      })
      if (res.success) {
        // Refresh channels
        const channelsRes = await ChatService.listChannels(workspaceId)
        if (channelsRes.success) {
          setChannels(channelsRes.data)
        }
        reset()
        setSelectedMemberIds([])
        onClose()
        if (onSuccess) onSuccess(res.data)
      } else {
        setErrorMsg(res.message || 'Failed to create channel')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(7, 7, 15, 0.8)',
        backdropFilter: 'blur(8px)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="card-glass shadow-strong animate-fade-in-up"
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '2rem',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-default)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Create Chat Channel
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Channels are where your team communicates about specific topics.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '0.25rem'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Error */}
        {errorMsg && (
          <div
            className="badge badge-error"
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.75rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              border: '1px solid rgba(239,68,68,0.2)'
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Channel Type Selector */}
          <div>
            <Label style={{ marginBottom: '0.5rem', display: 'block' }}>Channel Visibility</Label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setValue('type', 'public')}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.375rem',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: channelType === 'public' ? 'rgba(99,102,241,0.08)' : 'var(--bg-tertiary)',
                  border: `1px solid ${channelType === 'public' ? 'var(--accent-primary)' : 'var(--border-default)'}`,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', fontWeight: 700, color: channelType === 'public' ? 'var(--accent-tertiary)' : 'var(--text-primary)' }}>
                  <Hash size={14} /> Public
                </div>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
                  Anyone in the workspace can view and join.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setValue('type', 'private')}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.375rem',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: channelType === 'private' ? 'rgba(99,102,241,0.08)' : 'var(--bg-tertiary)',
                  border: `1px solid ${channelType === 'private' ? 'var(--accent-primary)' : 'var(--border-default)'}`,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', fontWeight: 700, color: channelType === 'private' ? 'var(--accent-tertiary)' : 'var(--text-primary)' }}>
                  <Lock size={14} /> Private
                </div>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
                  Only invited users can view and join.
                </span>
              </button>
            </div>
          </div>

          {/* Channel Name */}
          <div>
            <Label htmlFor="name">Channel Name</Label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginTop: '0.375rem' }}>
              <div style={{ position: 'absolute', left: '0.75rem', color: 'var(--text-muted)' }}>
                {channelType === 'public' ? <Hash size={14} /> : <Lock size={13} />}
              </div>
              <Input
                id="name"
                placeholder="e.g. general-chat"
                style={{ paddingLeft: '2rem' }}
                {...register('name')}
              />
            </div>
            {errors.name && (
              <span style={{ color: 'var(--color-error)', fontSize: '0.6875rem', marginTop: '0.25rem', display: 'block' }}>
                {errors.name.message}
              </span>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <textarea
              id="description"
              placeholder="What is this channel about?"
              style={{
                width: '100%',
                minHeight: '80px',
                marginTop: '0.375rem',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                padding: '0.625rem 0.75rem',
                fontSize: '0.875rem',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
              {...register('description')}
            />
            {errors.description && (
              <span style={{ color: 'var(--color-error)', fontSize: '0.6875rem', marginTop: '0.25rem', display: 'block' }}>
                {errors.description.message}
              </span>
            )}
          </div>

          {/* Private Channel Member Selector */}
          {channelType === 'private' && (
            <div>
              <Label style={{ marginBottom: '0.5rem', display: 'block' }}>Invite Members</Label>
              <div
                style={{
                  maxHeight: '130px',
                  overflowY: 'auto',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-tertiary)',
                  padding: '0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem'
                }}
              >
                {workspaceMembers.length <= 1 ? (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                    No other members in this workspace to invite.
                  </div>
                ) : (
                  workspaceMembers
                    .filter((m) => m.userId !== workspaceMembers[0].userId) // skip yourself (assuming first member is yourself, or handle properly)
                    .map((member) => {
                      const isChecked = selectedMemberIds.includes(member.userId)
                      return (
                        <div
                          key={member.userId}
                          onClick={() => handleMemberToggle(member.userId)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.375rem 0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            background: isChecked ? 'rgba(99,102,241,0.04)' : 'transparent',
                            transition: 'all 0.15s'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // handled by div click
                            style={{ cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                            {member.user.name}
                          </span>
                        </div>
                      )
                    })
                )}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '0.5rem 1rem',
                background: 'transparent',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '0.5rem 1.25rem',
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                color: '#ffffff',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                transition: 'opacity 0.15s'
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Creating...
                </>
              ) : (
                'Create Channel'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
export default ChannelModal
