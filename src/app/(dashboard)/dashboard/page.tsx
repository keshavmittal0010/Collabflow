'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useWorkspaceStore } from '@/store/workspace.store'
import { WorkspaceModal } from '@/components/workspaces/WorkspaceModal'
import { Users, FolderCheck, CheckSquare, Plus, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { user } = useAuth()
  const { workspaces, currentWorkspace, fetchWorkspaces, isLoading } = useWorkspaceStore()
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    fetchWorkspaces()
  }, [])

  const stats = [
    { name: 'Total Workspaces', value: workspaces.length.toString(), icon: Users, color: 'var(--accent-primary)' },
    { name: 'Active Workspace', value: currentWorkspace ? currentWorkspace.name : 'None', icon: FolderCheck, color: 'var(--accent-secondary)' },
    { name: 'Total Members', value: currentWorkspace ? currentWorkspace.members?.length.toString() || '1' : '0', icon: Users, color: 'var(--color-success)' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Banner */}
      <div
        className="card-glass"
        style={{
          padding: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Welcome back, <span className="gradient-text">{user?.name ? user.name.split(' ')[0] : 'Collaborator'}</span>!
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Here is what is happening in your workspaces today.
          </p>
        </div>
        <div className="badge badge-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}>
          ✨ Workspace Console
        </div>
      </div>

      {workspaces.length === 0 && !isLoading ? (
        /* Empty State */
        <div
          className="card-glass"
          style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.5rem',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-default)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
            }}
          >
            🏢
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '420px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>No workspaces found</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Get started by creating a new workspace. Workspaces allow you to invite team members and group your projects.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1.25rem',
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              color: '#ffffff',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            <Plus size={16} />
            Create Workspace
          </button>
        </div>
      ) : (
        /* Standard View */
        <>
          {/* Stats Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.name} className="card-glass" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div
                    style={{
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-default)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={24} style={{ color: stat.color }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{stat.name}</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {stat.value}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Main Grid: Workspaces List + Status */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {/* Workspaces List */}
            <div className="card-glass" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Your Workspaces</h2>
                <button
                  onClick={() => setModalOpen(true)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--accent-tertiary)',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  <Plus size={14} /> New
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {workspaces.map((ws) => (
                  <Link
                    key={ws.id}
                    href={`/workspace/${ws.id}`}
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
                      transition: 'all 0.15s ease',
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
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          fontSize: '14px',
                          fontWeight: 700,
                        }}
                      >
                        {ws.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{ws.name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {ws._count?.projects || 0} projects · {ws._count?.members || 1} members
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={16} style={{ color: 'var(--text-secondary)' }} />
                  </Link>
                ))}
              </div>
            </div>

            {/* Quick Actions / System */}
            <div className="card-glass" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Quick Overview</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Current Workspace:</span>
                  <span style={{ fontWeight: 600 }}>{currentWorkspace?.name || 'None Selected'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Your Role:</span>
                  <span className="badge badge-primary">
                    {currentWorkspace?.members?.find((m) => m.userId === user?.id)?.role || 'Member'}
                  </span>
                </div>
                {currentWorkspace && (
                  <Link
                    href={`/workspace/${currentWorkspace.id}/settings`}
                    style={{
                      marginTop: '1.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0.625rem',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      textDecoration: 'none',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      transition: 'all 0.15s ease',
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
                    Workspace Settings
                  </Link>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Workspace Creation Modal */}
      <WorkspaceModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
