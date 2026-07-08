'use client'

import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreateProjectSchema, CreateProjectSchemaType } from '@/lib/validations'
import { ProjectService } from '@/services/project.service'
import { useProjectStore } from '@/store/project.store'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ProjectModalProps {
  workspaceId: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function ProjectModal({ workspaceId, isOpen, onClose, onSuccess }: ProjectModalProps) {
  const { fetchProjects } = useProjectStore()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [manualIdentifier, setManualIdentifier] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<CreateProjectSchemaType>({
    resolver: zodResolver(CreateProjectSchema),
    defaultValues: {
      name: '',
      identifier: '',
      description: '',
      status: 'planning',
      priority: 'medium',
      isPublic: false
    }
  })

  const nameVal = watch('name')

  // Auto-generate project identifier from name (e.g. Acme Corp → ACM)
  useEffect(() => {
    if (nameVal && !manualIdentifier) {
      const generated = nameVal
        .split(/\s+/)
        .map((w) => w.substring(0, 1))
        .join('')
        .replace(/[^A-Za-z0-9]/g, '')
        .substring(0, 4)
        .toUpperCase()
      setValue('identifier', generated || 'PROJ', { shouldValidate: true })
    }
  }, [nameVal, setValue, manualIdentifier])

  if (!isOpen) return null

  const onSubmit = async (data: CreateProjectSchemaType) => {
    setErrorMsg(null)
    setIsSubmitting(true)
    try {
      const res = await ProjectService.createProject(workspaceId, data)
      if (res.success) {
        await fetchProjects(workspaceId)
        reset()
        onClose()
        if (onSuccess) onSuccess()
      } else {
        setErrorMsg(res.message || 'Failed to create project')
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
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Create New Project</h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Projects house boards, columns, and tasks. Organize work by team, feature, or goal.
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
          {/* Name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Label htmlFor="proj-name">Project Name</Label>
            <Input id="proj-name" placeholder="Billing Upgrades" disabled={isSubmitting} {...register('name')} />
            {errors.name && <span style={{ fontSize: '0.75rem', color: 'var(--color-error)' }}>{errors.name.message}</span>}
          </div>

          {/* Identifier Key */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Label htmlFor="proj-ident">Project Identifier (Key)</Label>
            <Input
              id="proj-ident"
              placeholder="BILL"
              disabled={isSubmitting}
              {...register('identifier', {
                onChange: (e) => {
                  setManualIdentifier(true)
                  setValue('identifier', e.target.value.toUpperCase(), { shouldValidate: true })
                }
              })}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Short code used as a prefix for all task keys in this project (e.g. BILL-12, BILL-102).
            </span>
            {errors.identifier && <span style={{ fontSize: '0.75rem', color: 'var(--color-error)' }}>{errors.identifier.message}</span>}
          </div>

          {/* Priority */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Label htmlFor="proj-priority">Priority</Label>
            <select
              id="proj-priority"
              disabled={isSubmitting}
              {...register('priority')}
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                padding: '0.5rem 0.75rem',
                fontSize: '0.875rem',
                outline: 'none',
                height: '40px'
              }}
            >
              <option value="none">None</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Label htmlFor="proj-desc">Description</Label>
            <textarea
              id="proj-desc"
              rows={3}
              placeholder="Brief description about this project (optional)"
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
                resize: 'none'
              }}
            />
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
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
export default ProjectModal
