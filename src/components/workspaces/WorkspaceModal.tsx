'use client'

import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreateWorkspaceSchema, CreateWorkspaceSchemaType } from '@/lib/validations'
import { WorkspaceService } from '@/services/workspace.service'
import { useWorkspaceStore } from '@/store/workspace.store'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { slugify } from '@/lib/utils'

interface WorkspaceModalProps {
  isOpen: boolean
  onClose: () => void
}

export function WorkspaceModal({ isOpen, onClose }: WorkspaceModalProps) {
  const router = useRouter()
  const { fetchWorkspaces, setCurrentWorkspace } = useWorkspaceStore()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [manualSlug, setManualSlug] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<CreateWorkspaceSchemaType>({
    resolver: zodResolver(CreateWorkspaceSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: ''
    }
  })

  const nameVal = watch('name')

  // Auto-generate slug from name unless user modifies slug manually
  useEffect(() => {
    if (nameVal && !manualSlug) {
      setValue('slug', slugify(nameVal), { shouldValidate: true })
    }
  }, [nameVal, setValue, manualSlug])

  if (!isOpen) return null

  const onSubmit = async (data: CreateWorkspaceSchemaType) => {
    setErrorMsg(null)
    setIsSubmitting(true)
    try {
      const res = await WorkspaceService.createWorkspace(data)
      if (res.success) {
        // Refresh workspaces list
        await fetchWorkspaces()
        setCurrentWorkspace(res.data as any)
        reset()
        onClose()
        router.push(`/workspace/${res.data.id}`)
      } else {
        setErrorMsg(res.message || 'Failed to create workspace')
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
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(7, 7, 15, 0.8)',
        backdropFilter: 'blur(8px)'
      }}
      onClick={onClose}
    >
      <div
        className="card-glass shadow-strong animate-scaleIn"
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '2.5rem',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Create New Workspace</h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Workspaces are shared hubs where your team can organize projects, tasks, and channels.
          </p>
        </div>

        {errorMsg && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#f87171',
              fontSize: '0.8125rem',
              fontWeight: 500,
              marginBottom: '1rem'
            }}
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Name Field */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Label htmlFor="ws-name" style={{ color: 'var(--text-secondary)' }}>
              Workspace Name
            </Label>
            <Input
              id="ws-name"
              placeholder="Acme Corporation"
              disabled={isSubmitting}
              {...register('name')}
              style={{
                borderColor: errors.name ? 'var(--color-error)' : 'var(--border-default)'
              }}
            />
            {errors.name && (
              <span style={{ fontSize: '0.75rem', color: 'var(--color-error)' }}>
                {errors.name.message}
              </span>
            )}
          </div>

          {/* Slug Field */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Label htmlFor="ws-slug" style={{ color: 'var(--text-secondary)' }}>
              Workspace URL Slug
            </Label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>collabflow.com/</span>
              <Input
                id="ws-slug"
                placeholder="acme"
                disabled={isSubmitting}
                {...register('slug', {
                  onChange: () => {
                    setManualSlug(true)
                  }
                })}
                style={{
                  borderColor: errors.slug ? 'var(--color-error)' : 'var(--border-default)',
                  flex: 1
                }}
              />
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Unique identifier used in your workspace URL path.
            </span>
            {errors.slug && (
              <span style={{ fontSize: '0.75rem', color: 'var(--color-error)' }}>
                {errors.slug.message}
              </span>
            )}
          </div>

          {/* Description Field */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Label htmlFor="ws-desc" style={{ color: 'var(--text-secondary)' }}>
              Description
            </Label>
            <textarea
              id="ws-desc"
              rows={3}
              placeholder="Brief description about your team or project (optional)"
              disabled={isSubmitting}
              {...register('description')}
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                padding: '0.5rem 0.75rem',
                fontSize: '0.875rem',
                fontFamily: 'inherit',
                outline: 'none',
                resize: 'none',
                width: '100%'
              }}
            />
            {errors.description && (
              <span style={{ fontSize: '0.75rem', color: 'var(--color-error)' }}>
                {errors.description.message}
              </span>
            )}
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '0.5rem 1rem',
                background: 'transparent',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1.25rem',
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                color: '#ffffff',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
                boxShadow: 'var(--shadow-glow)'
              }}
            >
              {isSubmitting ? (
                <>
                  <div
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#ffffff',
                      animation: 'spin 1s linear infinite'
                    }}
                  />
                  Creating...
                </>
              ) : (
                'Create Workspace'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
export default WorkspaceModal
