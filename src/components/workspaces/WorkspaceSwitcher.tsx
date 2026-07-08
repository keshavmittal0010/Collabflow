'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useWorkspaceStore } from '@/store/workspace.store'
import { WorkspaceModal } from './WorkspaceModal'
import { useRouter } from 'next/navigation'
import { ChevronDown, Plus, Check } from 'lucide-react'

interface WorkspaceSwitcherProps {
  collapsed?: boolean
}

export function WorkspaceSwitcher({ collapsed = false }: WorkspaceSwitcherProps) {
  const router = useRouter()
  const { workspaces, currentWorkspace, setCurrentWorkspace, fetchWorkspaces } = useWorkspaceStore()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fetch workspaces list on switcher mount
  useEffect(() => {
    fetchWorkspaces()
  }, [])

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectWorkspace = (wsId: string) => {
    const ws = workspaces.find((w) => w.id === wsId)
    if (ws) {
      setCurrentWorkspace(ws)
      setDropdownOpen(false)
      router.push(`/workspace/${ws.id}`)
    }
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Switcher Button */}
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          width: '100%',
          padding: collapsed ? '0.5rem' : '0.625rem 0.75rem',
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--text-primary)',
          fontSize: '0.875rem',
          fontWeight: 600,
          cursor: 'pointer',
          outline: 'none',
          transition: 'border-color 0.15s, background 0.15s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--accent-primary)'
          e.currentTarget.style.background = 'var(--glass-bg-hover)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--glass-border)'
          e.currentTarget.style.background = 'var(--glass-bg)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0 }}>
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 800,
              flexShrink: 0
            }}
          >
            {currentWorkspace ? currentWorkspace.name.substring(0, 2).toUpperCase() : 'CF'}
          </div>
          {!collapsed && (
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                textAlign: 'left'
              }}
            >
              {currentWorkspace ? currentWorkspace.name : 'Select Workspace'}
            </span>
          )}
        </div>
        {!collapsed && <ChevronDown size={16} style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem', flexShrink: 0 }} />}
      </button>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <div
          className="card-glass shadow-strong animate-fadeIn"
          style={{
            position: 'absolute',
            top: collapsed ? '0' : 'calc(100% + 0.375rem)',
            left: collapsed ? 'calc(100% + 0.5rem)' : '0',
            width: collapsed ? '220px' : '100%',
            maxHeight: '320px',
            overflowY: 'auto',
            zIndex: 40,
            padding: '0.375rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <div style={{ padding: '0.375rem 0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            WORKSPACES
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
            {workspaces.map((ws) => {
              const isActive = currentWorkspace?.id === ws.id
              return (
                <button
                  key={ws.id}
                  onClick={() => selectWorkspace(ws.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0.5rem',
                    background: isActive ? 'var(--glass-bg-hover)' : 'transparent',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontSize: '0.8125rem',
                    fontWeight: isActive ? 600 : 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s, color 0.15s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '4px',
                        background: isActive
                          ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))'
                          : 'var(--bg-tertiary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isActive ? '#ffffff' : 'var(--text-secondary)',
                        fontSize: '10px',
                        fontWeight: 700,
                        flexShrink: 0
                      }}
                    >
                      {ws.name.substring(0, 2).toUpperCase()}
                    </div>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ws.name}
                    </span>
                  </div>
                  {isActive && <Check size={14} style={{ color: 'var(--accent-tertiary)' }} />}
                </button>
              )
            })}
          </div>

          <div style={{ height: '1px', background: 'var(--border-default)', margin: '0.25rem 0' }} />

          {/* Create Workspace Button inside Dropdown */}
          <button
            onClick={() => {
              setDropdownOpen(false)
              setModalOpen(true)
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              width: '100%',
              padding: '0.5rem',
              background: 'transparent',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--accent-tertiary)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <Plus size={14} />
            Create Workspace
          </button>
        </div>
      )}

      {/* Workspace Creation Modal */}
      <WorkspaceModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
export default WorkspaceSwitcher
