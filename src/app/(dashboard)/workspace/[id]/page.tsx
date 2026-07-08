'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { WorkspaceService } from '@/services/workspace.service'
import { useWorkspaceStore } from '@/store/workspace.store'
import { getInitials } from '@/lib/utils'
import { Users, Folder, Settings, UserPlus, Info, ChevronRight, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { ProjectModal } from '@/components/projects/ProjectModal'

export default function WorkspaceDetailPage() {
  const router = useRouter()
  const { id } = useParams() as { id: string }
  const { setCurrentWorkspace } = useWorkspaceStore()
  const [projectModalOpen, setProjectModalOpen] = useState(false)

  // Fetch workspace details with React Query
  const { data: res, isLoading, error, refetch } = useQuery({
    queryKey: ['workspace', id],
    queryFn: () => WorkspaceService.getWorkspace(id),
    enabled: !!id
  })

  const workspace = res?.success ? res.data : null

  // Sync with Zustand currentWorkspace
  useEffect(() => {
    if (workspace) {
      setCurrentWorkspace(workspace as any)
    }
  }, [workspace, setCurrentWorkspace])

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
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Loading workspace details...</span>
      </div>
    )
  }

  if (error || !res?.success || !workspace) {
    return (
      <div className="card-glass" style={{ padding: '3rem', textAlign: 'center', maxWidth: '500px', margin: '2rem auto' }}>
        <Info size={40} style={{ color: 'var(--color-error)', marginBottom: '1rem' }} />
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Failed to load workspace</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          {res?.message || 'You may not have permission to view this workspace or it may have been deleted.'}
        </p>
        <Link
          href="/dashboard"
          style={{
            padding: '0.5rem 1rem',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: 600
          }}
        >
          Back to Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Panel */}
      <div
        className="card-glass"
        style={{
          padding: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '22px',
              fontWeight: 800,
              boxShadow: 'var(--shadow-glow)'
            }}
          >
            {workspace.name.substring(0, 2).toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>{workspace.name}</h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {workspace.description || 'No description provided.'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link
            href={`/workspace/${id}/analytics`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1rem',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 600,
              transition: 'all 0.15s ease'
            }}
            className="glass-hover"
          >
            <BarChart3 size={16} style={{ color: 'var(--accent-primary)' }} />
            Analytics
          </Link>
          <Link
            href={`/workspace/${id}/settings`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1rem',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 600,
              transition: 'all 0.15s ease'
            }}
            className="glass-hover"
          >
            <Settings size={16} />
            Settings
          </Link>
        </div>
      </div>

      {/* Grid Content */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem'
        }}
      >
        {/* Projects list */}
        <div className="card-glass" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Folder size={18} style={{ color: 'var(--accent-primary)' }} />
              Projects
            </h2>
            <button
              onClick={() => setProjectModalOpen(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--accent-tertiary)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              + Create Project
            </button>
          </div>

          {workspace.projects.length === 0 ? (
            <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <span>No projects created yet. Create a project to start planning boards and tracking tasks.</span>
              <button
                onClick={() => setProjectModalOpen(true)}
                style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  padding: '0.375rem 0.75rem',
                  cursor: 'pointer'
                }}
              >
                Create Project
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {workspace.projects.map((proj) => (
                <Link
                  key={proj.id}
                  href={`/workspace/${id}/project/${proj.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-hover)'
                    e.currentTarget.style.background = 'var(--bg-elevated)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-default)'
                    e.currentTarget.style.background = 'var(--bg-tertiary)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '4px',
                        background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        fontSize: '10px',
                        fontWeight: 800
                      }}
                    >
                      {proj.identifier}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{proj.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                        Priority: {proj.priority} · Status: {proj.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={14} style={{ color: 'var(--text-secondary)' }} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Members list */}
        <div className="card-glass" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} style={{ color: 'var(--accent-secondary)' }} />
              Members ({workspace.members.length})
            </h2>
            <Link
              href={`/workspace/${id}/settings?tab=members`}
              style={{
                color: 'var(--accent-tertiary)',
                fontSize: '0.75rem',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <UserPlus size={14} /> Invite
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {workspace.members.map((member) => (
              <div key={member.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-default)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--accent-tertiary)'
                    }}
                  >
                    {getInitials(member.user.name)}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{member.user.name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{member.user.email}</span>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    padding: '0.25rem 0.5rem',
                    borderRadius: 'var(--radius-full)',
                    background: member.role === 'owner' ? 'rgba(99,102,241,0.1)' : 'var(--bg-tertiary)',
                    border: '1px solid',
                    borderColor: member.role === 'owner' ? 'rgba(99,102,241,0.2)' : 'var(--border-default)',
                    color: member.role === 'owner' ? 'var(--accent-tertiary)' : 'var(--text-secondary)'
                  }}
                >
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Project Creation Modal */}
      <ProjectModal
        workspaceId={id}
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  )
}
