'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { getInitials } from '@/lib/utils'
import { LogOut, LayoutDashboard, MessageSquare, Settings, BarChart3, AppWindow, ChevronLeft, ChevronRight, Menu } from 'lucide-react'
import { WorkspaceSwitcher } from '@/components/workspaces/WorkspaceSwitcher'
import { NotificationCenter } from '@/components/notifications/NotificationCenter'
import { useWorkspaceStore } from '@/store/workspace.store'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout, isLoggingOut } = useAuth()
  const { currentWorkspace } = useWorkspaceStore()
  
  // Layout responsiveness states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Touch Swipe Gesture coordinates
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Auto-close mobile drawer on route transitions
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  // Swipe gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 60
    const isRightSwipe = distance < -60

    if (isMobile) {
      if (isLeftSwipe && mobileOpen) {
        setMobileOpen(false) // Swipe left closes drawer
      } else if (isRightSwipe && !mobileOpen && touchStart < 40) {
        setMobileOpen(true) // Swipe right from screen edge opens drawer
      }
    }
    setTouchStart(null)
    setTouchEnd(null)
  }

  const navItems = [
    { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Chat Channels', path: '/chat', icon: MessageSquare },
    { name: 'Profile Settings', path: '/dashboard/settings', icon: Settings },
  ]

  const showBackButton = pathname !== '/dashboard'

  // Sidebar Layout Styles
  const sidebarStyles: React.CSSProperties = isMobile
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        width: '260px',
        zIndex: 50,
        transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        padding: '1.5rem 1rem',
      }
    : {
        position: 'sticky',
        top: 0,
        height: '100vh',
        width: sidebarCollapsed ? '76px' : '260px',
        minWidth: sidebarCollapsed ? '76px' : '260px',
        maxWidth: sidebarCollapsed ? '76px' : '260px',
        transform: 'none',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.3s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        padding: sidebarCollapsed ? '1.5rem 0.5rem' : '1.5rem 1rem',
      }

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-sans)',
        position: 'relative',
        overflowX: 'hidden'
      }}
    >
      {/* Mobile Backdrop Overlay */}
      {isMobile && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 45,
            animation: 'fadeIn 0.2s ease-out'
          }}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        style={{
          flexShrink: 0,
          borderRight: '1px solid var(--border-default)',
          background: 'var(--bg-secondary)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflowY: 'auto',
          ...sidebarStyles
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Logo & Collapse Action */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: (sidebarCollapsed && !isMobile) ? 'center' : 'space-between',
              gap: '0.75rem',
              paddingLeft: (sidebarCollapsed && !isMobile) ? '0' : '0.5rem',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  boxShadow: 'var(--shadow-glow)',
                  flexShrink: 0
                }}
              >
                ⚡
              </div>
              {!(sidebarCollapsed && !isMobile) && (
                <span
                  style={{
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    letterSpacing: '-0.03em',
                  }}
                  className="gradient-text"
                >
                  CollabFlow
                </span>
              )}
            </div>
            
            {/* Collapse sidebar button (desktop only) */}
            {!isMobile && (
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.375rem',
                  borderRadius: '50%',
                  transition: 'all 0.15s ease',
                  position: sidebarCollapsed ? 'absolute' : 'static',
                  zIndex: 10,
                  bottom: sidebarCollapsed ? '-2.5rem' : 'auto'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--text-primary)'
                  e.currentTarget.style.borderColor = 'var(--accent-primary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-secondary)'
                  e.currentTarget.style.borderColor = 'var(--border-default)'
                }}
              >
                {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
              </button>
            )}
          </div>

          {/* Workspace Switcher */}
          <div style={{ padding: (sidebarCollapsed && !isMobile) ? '0' : '0 0.5rem', transition: 'padding 0.3s' }}>
            <WorkspaceSwitcher collapsed={sidebarCollapsed && !isMobile} />
          </div>

          {/* Nav Items */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {!(sidebarCollapsed && !isMobile) && (
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', paddingLeft: '0.75rem', letterSpacing: '0.05em' }}>
                  PLATFORM
                </span>
              )}
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.path
                return (
                  <Link
                    key={item.name}
                    href={item.path}
                    title={(sidebarCollapsed && !isMobile) ? item.name : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: (sidebarCollapsed && !isMobile) ? 'center' : 'flex-start',
                      gap: (sidebarCollapsed && !isMobile) ? '0' : '0.75rem',
                      padding: '0.625rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      textDecoration: 'none',
                      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                      background: isActive ? 'var(--glass-bg-hover)' : 'transparent',
                      border: isActive ? '1px solid var(--glass-border)' : '1px solid transparent',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Icon size={18} style={{ color: isActive ? 'var(--accent-tertiary)' : 'inherit', flexShrink: 0 }} />
                    {!(sidebarCollapsed && !isMobile) && item.name}
                  </Link>
                )
              })}
            </div>

            {currentWorkspace && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                {!(sidebarCollapsed && !isMobile) && (
                  <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', paddingLeft: '0.75rem', letterSpacing: '0.05em', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>WORKSPACE</span>
                    <span style={{ fontSize: '0.625rem', padding: '0.0625rem 0.25rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      {currentWorkspace.plan}
                    </span>
                  </span>
                )}
                
                {/* Workspace Hub Link */}
                <Link
                  href={`/workspace/${currentWorkspace.id}`}
                  title={(sidebarCollapsed && !isMobile) ? "Workspace Hub" : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: (sidebarCollapsed && !isMobile) ? 'center' : 'flex-start',
                    gap: (sidebarCollapsed && !isMobile) ? '0' : '0.75rem',
                    padding: '0.625rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    textDecoration: 'none',
                    color: pathname === `/workspace/${currentWorkspace.id}` ? 'var(--text-primary)' : 'var(--text-secondary)',
                    background: pathname === `/workspace/${currentWorkspace.id}` ? 'var(--glass-bg-hover)' : 'transparent',
                    border: pathname === `/workspace/${currentWorkspace.id}` ? '1px solid var(--glass-border)' : '1px solid transparent',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <AppWindow size={18} style={{ color: pathname === `/workspace/${currentWorkspace.id}` ? 'var(--accent-tertiary)' : 'inherit', flexShrink: 0 }} />
                  {!(sidebarCollapsed && !isMobile) && "Workspace Hub"}
                </Link>

                {/* Workspace Settings Link */}
                <Link
                  href={`/workspace/${currentWorkspace.id}/settings`}
                  title={(sidebarCollapsed && !isMobile) ? "Workspace Settings" : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: (sidebarCollapsed && !isMobile) ? 'center' : 'flex-start',
                    gap: (sidebarCollapsed && !isMobile) ? '0' : '0.75rem',
                    padding: '0.625rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    textDecoration: 'none',
                    color: pathname.startsWith(`/workspace/${currentWorkspace.id}/settings`) ? 'var(--text-primary)' : 'var(--text-secondary)',
                    background: pathname.startsWith(`/workspace/${currentWorkspace.id}/settings`) ? 'var(--glass-bg-hover)' : 'transparent',
                    border: pathname.startsWith(`/workspace/${currentWorkspace.id}/settings`) ? '1px solid var(--glass-border)' : '1px solid transparent',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Settings size={18} style={{ color: pathname.startsWith(`/workspace/${currentWorkspace.id}/settings`) ? 'var(--accent-tertiary)' : 'inherit', flexShrink: 0 }} />
                  {!(sidebarCollapsed && !isMobile) && "Workspace Settings"}
                </Link>

                {/* Workspace Analytics Link */}
                <Link
                  href={`/workspace/${currentWorkspace.id}/analytics`}
                  title={(sidebarCollapsed && !isMobile) ? "Workspace Analytics" : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: (sidebarCollapsed && !isMobile) ? 'center' : 'flex-start',
                    gap: (sidebarCollapsed && !isMobile) ? '0' : '0.75rem',
                    padding: '0.625rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    textDecoration: 'none',
                    color: pathname.startsWith(`/workspace/${currentWorkspace.id}/analytics`) ? 'var(--text-primary)' : 'var(--text-secondary)',
                    background: pathname.startsWith(`/workspace/${currentWorkspace.id}/analytics`) ? 'var(--glass-bg-hover)' : 'transparent',
                    border: pathname.startsWith(`/workspace/${currentWorkspace.id}/analytics`) ? '1px solid var(--glass-border)' : '1px solid transparent',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <BarChart3 size={18} style={{ color: pathname.startsWith(`/workspace/${currentWorkspace.id}/analytics`) ? 'var(--accent-tertiary)' : 'inherit', flexShrink: 0 }} />
                  {!(sidebarCollapsed && !isMobile) && "Workspace Analytics"}
                </Link>
              </div>
            )}
          </nav>
        </div>

        {/* Footer with User Profile */}
        {user && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-default)',
              alignItems: (sidebarCollapsed && !isMobile) ? 'center' : 'stretch',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: (sidebarCollapsed && !isMobile) ? 'center' : 'flex-start', gap: '0.75rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-default)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--accent-tertiary)',
                  flexShrink: 0
                }}
              >
                {getInitials(user.name)}
              </div>
              {!(sidebarCollapsed && !isMobile) && (
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.name}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.email}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="btn-premium-flow"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: (sidebarCollapsed && !isMobile) ? '0' : '0.5rem',
                padding: '0.5rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#f87171',
                fontSize: '0.8125rem',
                fontWeight: 600,
                width: '100%',
                cursor: 'pointer'
              }}
            >
              <LogOut size={14} style={{ flexShrink: 0 }} />
              {!(sidebarCollapsed && !isMobile) && (isLoggingOut ? 'Leaving...' : 'Sign Out')}
            </button>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <header
          style={{
            height: 'var(--navbar-height)',
            borderBottom: '1px solid var(--border-default)',
            background: 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isMobile ? '0 1rem' : '0 2rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {isMobile && (
              <button
                onClick={() => setMobileOpen(true)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Menu size={20} />
              </button>
            )}
            {showBackButton && (
              <button
                onClick={() => router.back()}
                className="btn-premium-flow"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.375rem 0.75rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  cursor: 'pointer'
                }}
              >
                <ChevronLeft size={14} />
                Back
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Server Time: {new Date().toLocaleDateString()}
            </span>
            <div style={{ width: '1px', height: '16px', background: 'var(--border-default)' }} />
            <NotificationCenter />
          </div>
        </header>
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '1rem' : '2rem' }}>{children}</div>
      </main>
    </div>
  )
}
