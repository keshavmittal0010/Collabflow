'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { UpdateProjectSchema, UpdateProjectSchemaType } from '@/lib/validations'
import { ProjectService } from '@/services/project.service'
import { useWorkspaceStore } from '@/store/workspace.store'
import { useProjectStore } from '@/store/project.store'
import { useAuth } from '@/hooks/useAuth'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Info, Settings, Trash, Shield, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ProjectSettingsPage() {
  const router = useRouter()
  const { id: workspaceId, projectId } = useParams() as { id: string; projectId: string }
  const { user: currentUser } = useAuth()
  const { currentWorkspace } = useWorkspaceStore()
  const { fetchProjects } = useProjectStore()
  const queryClient = useQueryClient()
  
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Fetch project details
  const { data: res, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => ProjectService.getProject(projectId),
    enabled: !!projectId
  })

  const project = res?.success ? res.data : null

  // Verify roles
  const workspaceMember = currentWorkspace?.members.find((m) => m.userId === currentUser?.id)
  const isWorkspaceOwner = workspaceMember?.role === 'owner'
  const isWorkspaceAdminOrOwner = workspaceMember?.role === 'owner' || workspaceMember?.role === 'admin'
  
  const projectMember = project?.members.find((m) => m.userId === currentUser?.id)
  const isProjectLead = projectMember?.role === 'lead'

  const canEdit = isWorkspaceAdminOrOwner || isProjectLead
  const canDelete = isWorkspaceOwner || isProjectLead

  // React Hook Form
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<UpdateProjectSchemaType>({
    resolver: zodResolver(UpdateProjectSchema)
  })

  // Prefill Form
  useEffect(() => {
    if (project) {
      setValue('name', project.name)
      setValue('identifier', project.identifier)
      setValue('description', project.description || '')
      setValue('status', project.status)
      setValue('priority', project.priority)
    }
  }, [project, setValue])

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateProjectSchemaType) => ProjectService.updateProject(projectId, data),
    onSuccess: async (data) => {
      if (data.success) {
        setFeedbackMsg({ type: 'success', text: 'Project settings updated successfully!' })
        queryClient.invalidateQueries({ queryKey: ['project', projectId] })
        await fetchProjects(workspaceId)
      } else {
        setFeedbackMsg({ type: 'error', text: data.message || 'Failed to update project' })
      }
    }
  })

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: () => ProjectService.deleteProject(projectId),
    onSuccess: async (data) => {
      if (data.success) {
        await fetchProjects(workspaceId)
        router.push(`/workspace/${workspaceId}`)
      } else {
        setFeedbackMsg({ type: 'error', text: data.message || 'Failed to delete project' })
      }
    }
  })

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
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Loading settings...</span>
      </div>
    )
  }

  if (!res?.success || !project) {
    return (
      <div className="card-glass" style={{ padding: '3rem', textAlign: 'center', maxWidth: '500px', margin: '2rem auto' }}>
        <Info size={40} style={{ color: 'var(--color-error)', marginBottom: '1rem' }} />
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Access Denied</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          This project settings page cannot be loaded or you do not have permission.
        </p>
        <Link href={`/workspace/${workspaceId}`} style={{ padding: '0.5rem 1rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>
          Back to Workspace
        </Link>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-default)', paddingBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link
            href={`/workspace/${workspaceId}/project/${projectId}`}
            style={{
              padding: '0.375rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ArrowLeft size={16} />
          </Link>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Project Settings</h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Manage {project.name} properties and metadata.
            </p>
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: feedbackMsg.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${feedbackMsg.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
            color: feedbackMsg.type === 'success' ? '#4ade80' : '#f87171',
            fontSize: '0.875rem',
            fontWeight: 500
          }}
        >
          {feedbackMsg.text}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Settings Form */}
        <div className="card-glass" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.25rem' }}>General Settings</h3>
          <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Label htmlFor="proj-name">Project Name</Label>
              <Input id="proj-name" disabled={!canEdit || updateMutation.isPending} {...register('name')} />
              {errors.name && <span style={{ fontSize: '0.75rem', color: 'var(--color-error)' }}>{errors.name.message}</span>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Label htmlFor="proj-ident">Project Identifier (Key)</Label>
              <Input
                id="proj-ident"
                disabled={!canEdit || updateMutation.isPending}
                {...register('identifier', {
                  onChange: (e) => {
                    setValue('identifier', e.target.value.toUpperCase(), { shouldValidate: true })
                  }
                })}
              />
              {errors.identifier && <span style={{ fontSize: '0.75rem', color: 'var(--color-error)' }}>{errors.identifier.message}</span>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Label htmlFor="proj-status">Status</Label>
                <select
                  id="proj-status"
                  disabled={!canEdit || updateMutation.isPending}
                  {...register('status')}
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
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Label htmlFor="proj-priority">Priority</Label>
                <select
                  id="proj-priority"
                  disabled={!canEdit || updateMutation.isPending}
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
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Label htmlFor="proj-desc">Description</Label>
              <textarea
                id="proj-desc"
                rows={3}
                disabled={!canEdit || updateMutation.isPending}
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

            {canEdit && (
              <button
                type="submit"
                disabled={updateMutation.isPending}
                style={{
                  padding: '0.5rem 1.25rem',
                  background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  color: '#ffffff',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: updateMutation.isPending ? 'not-allowed' : 'pointer',
                  alignSelf: 'flex-start',
                  boxShadow: 'var(--shadow-glow)'
                }}
              >
                Save Changes
              </button>
            )}
          </form>
        </div>

        {/* Delete Project */}
        {canDelete && (
          <div className="card-glass" style={{ padding: '2rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-error)', marginBottom: '0.5rem' }}>Danger Zone</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Deleting this project is permanent. It will delete all boards, columns, tasks, and attachments under this project. This action cannot be undone.
            </p>
            <button
              onClick={() => {
                if (confirm('Are you absolutely sure you want to delete this project? This cannot be undone.')) {
                  deleteMutation.mutate()
                }
              }}
              disabled={deleteMutation.isPending}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1.25rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: 'var(--radius-md)',
                color: '#f87171',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: deleteMutation.isPending ? 'not-allowed' : 'pointer'
              }}
            >
              <Trash size={16} />
              Delete Project
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
