'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/services/auth.service'
import { ApiResponse } from '@/types/auth.types'
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  ListTodo,
  CheckCircle2,
  FolderKanban,
  Info,
  Loader2,
  Activity,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'

interface KPIStats {
  totalProjects: number
  totalTasks: number
  completedTasks: number
  openTasks: number
  completionRate: number
}

interface MemberWorkload {
  id: string
  name: string
  avatarUrl: string | null
  openTasksCount: number
}

interface VelocityPoint {
  date: string
  count: number
}

interface AnalyticsData {
  kpis: KPIStats
  priorities: {
    low: number
    medium: number
    high: number
    urgent: number
  }
  memberWorkloads: MemberWorkload[]
  projectVelocity: VelocityPoint[]
}

export default function WorkspaceAnalyticsPage() {
  const router = useRouter()
  const { id } = useParams() as { id: string }

  // Query workspace analytics details
  const { data: res, isLoading, error } = useQuery({
    queryKey: ['workspace-analytics', id],
    queryFn: async () => {
      return apiFetch<AnalyticsData>(`/api/workspaces/${id}/analytics`, {
        method: 'GET'
      })
    },
    enabled: !!id
  })

  const analytics = res?.success ? res.data : null

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem' }}>
        <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-primary)' }} />
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Aggregating metrics...</span>
      </div>
    )
  }

  if (error || !res?.success || !analytics) {
    return (
      <div className="card-glass" style={{ padding: '3rem', textAlign: 'center', maxWidth: '500px', margin: '4rem auto' }}>
        <Info size={40} style={{ color: 'var(--color-error)', marginBottom: '1rem' }} />
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Failed to load analytics</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          {res?.message || 'Something went wrong while pulling workspace metrics.'}
        </p>
        <Link
          href={`/workspace/${id}`}
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
          Back to Workspace
        </Link>
      </div>
    )
  }

  const { kpis, priorities, memberWorkloads, projectVelocity } = analytics

  // Calculate SVG line points for Velocity Chart
  // Grid size: width=600, height=220. Margin: left=40, right=20, top=20, bottom=35.
  const chartWidth = 600
  const chartHeight = 220
  const paddingLeft = 40
  const paddingRight = 20
  const paddingTop = 20
  const paddingBottom = 35

  const graphWidth = chartWidth - paddingLeft - paddingRight
  const graphHeight = chartHeight - paddingTop - paddingBottom

  const maxVal = Math.max(...projectVelocity.map((v) => v.count), 5) // ensure divisor is non-zero, at least 5 grid ticks

  const getCoordinates = () => {
    return projectVelocity.map((pt, idx) => {
      const x = paddingLeft + (idx / (projectVelocity.length - 1)) * graphWidth
      const y = chartHeight - paddingBottom - (pt.count / maxVal) * graphHeight
      return { x, y }
    })
  }

  const coords = getCoordinates()
  
  // Form linear path coordinates
  const linePath = coords.reduce((acc, c, idx) => {
    return acc + `${idx === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)} `
  }, '')

  // Form filled area coordinates under the path line
  const fillPath = linePath
    ? `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${(chartHeight - paddingBottom).toFixed(1)} L ${coords[0].x.toFixed(1)} ${(chartHeight - paddingBottom).toFixed(1)} Z`
    : ''

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Upper Navigation & Title panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Link
              href={`/workspace/${id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-default)',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                textDecoration: 'none',
                transition: 'all 0.15s ease'
              }}
              className="glass-hover"
            >
              <ArrowLeft size={16} />
            </Link>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Analytics Dashboard</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginTop: '0.25rem' }}>
            Workspace Metrics
          </h1>
        </div>
      </div>

      {/* KPI Stats Grid cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem'
        }}
      >
        {/* KPI 1 - Projects */}
        <div className="card-glass" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', transform: 'translateZ(0)', transition: 'transform 0.2s ease' }}>
          <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(99,102,241,0.08)', color: 'var(--accent-primary)', display: 'flex' }}>
            <FolderKanban size={22} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Projects
            </span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {kpis.totalProjects}
            </span>
          </div>
        </div>

        {/* KPI 2 - Total Tasks */}
        <div className="card-glass" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', transform: 'translateZ(0)', transition: 'transform 0.2s ease' }}>
          <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(59,130,246,0.08)', color: 'var(--accent-secondary)', display: 'flex' }}>
            <ListTodo size={22} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Tasks
            </span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {kpis.totalTasks}
            </span>
          </div>
        </div>

        {/* KPI 3 - Completed Tasks */}
        <div className="card-glass" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', transform: 'translateZ(0)', transition: 'transform 0.2s ease' }}>
          <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(16,185,129,0.08)', color: 'var(--color-success)', display: 'flex' }}>
            <CheckCircle2 size={22} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Completed Tasks
            </span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {kpis.completedTasks}
            </span>
          </div>
        </div>

        {/* KPI 4 - Completion Rate */}
        <div className="card-glass" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', transform: 'translateZ(0)', transition: 'transform 0.2s ease' }}>
          <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(139,92,246,0.08)', color: 'var(--accent-tertiary)', display: 'flex' }}>
            <TrendingUp size={22} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Completion Rate
            </span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'baseline', gap: '0.125rem' }}>
              {kpis.completionRate}<span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>%</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '1.5rem'
        }}
      >
        {/* Project Velocity SVG Line graph */}
        <div className="card-glass" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={16} style={{ color: 'var(--accent-primary)' }} />
              Project Velocity (Past 14 Days)
            </h2>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Completed tasks / day</span>
          </div>

          {/* SVG line chart wrapper */}
          <div style={{ width: '100%', overflowX: 'auto', minHeight: '220px' }}>
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
              <defs>
                <linearGradient id="gradientFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grids */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                const y = paddingTop + ratio * graphHeight
                const label = Math.round(maxVal - ratio * maxVal)
                return (
                  <g key={idx} opacity="0.3">
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={chartWidth - paddingRight}
                      y2={y}
                      stroke="var(--border-default)"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={paddingLeft - 8}
                      y={y + 4}
                      fill="var(--text-muted)"
                      fontSize="9px"
                      textAnchor="end"
                      fontWeight="600"
                    >
                      {label}
                    </text>
                  </g>
                )
              })}

              {/* Shaded Area under path */}
              {fillPath && <path d={fillPath} fill="url(#gradientFill)" />}

              {/* Main Line path */}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="var(--accent-primary)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Coordinates Dot circles */}
              {coords.map((pt, idx) => (
                <g key={idx}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="4.5"
                    fill="var(--bg-secondary)"
                    stroke="var(--accent-primary)"
                    strokeWidth="2.5"
                  />
                  {/* Tooltip Hover value */}
                  <text
                    x={pt.x}
                    y={pt.y - 8}
                    fill="var(--text-primary)"
                    fontSize="9px"
                    fontWeight="800"
                    textAnchor="middle"
                    opacity={projectVelocity[idx].count > 0 ? 1 : 0}
                  >
                    {projectVelocity[idx].count}
                  </text>
                  {/* Axis Dates labels */}
                  <text
                    x={pt.x}
                    y={chartHeight - paddingBottom + 16}
                    fill="var(--text-muted)"
                    fontSize="8.5px"
                    fontWeight="600"
                    textAnchor="middle"
                    transform={`rotate(-25, ${pt.x}, ${chartHeight - paddingBottom + 16})`}
                  >
                    {projectVelocity[idx].date}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Priority breakdown visuals */}
        <div className="card-glass" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={16} style={{ color: 'var(--color-error)' }} />
            Tasks Priority Distribution
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, justifyContent: 'center' }}>
            {[
              { label: 'Urgent', count: priorities.urgent, color: 'var(--color-error)', bg: 'rgba(239,68,68,0.08)' },
              { label: 'High', count: priorities.high, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
              { label: 'Medium', count: priorities.medium, color: 'var(--accent-primary)', bg: 'rgba(99,102,241,0.08)' },
              { label: 'Low', count: priorities.low, color: 'var(--text-muted)', bg: 'var(--bg-tertiary)' }
            ].map((p, idx) => {
              const percentage = kpis.totalTasks > 0 ? Math.round((p.count / kpis.totalTasks) * 100) : 0
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{p.label}</span>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                      {p.count} tasks ({percentage}%)
                    </span>
                  </div>
                  {/* Progress bar wrapper */}
                  <div
                    style={{
                      height: '8px',
                      borderRadius: '4px',
                      background: 'var(--border-default)',
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${percentage}%`,
                        background: p.color,
                        borderRadius: '4px',
                        transition: 'width 0.5s ease-out'
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Row 3 - Member Workload progress list */}
      <div className="card-glass" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <BarChart3 size={18} style={{ color: 'var(--accent-secondary)' }} />
            Active Team Workload
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Distribution of open (uncompleted) tasks assigned to workspace members
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.25rem'
          }}
        >
          {memberWorkloads.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
              No members found in this workspace.
            </div>
          ) : (
            memberWorkloads.map((member) => {
              // Workload percentage relative to total open tasks in workspace
              const totalOpenTasks = kpis.openTasks
              const percentage = totalOpenTasks > 0 ? Math.round((member.openTasksCount / totalOpenTasks) * 100) : 0
              
              return (
                <div
                  key={member.id}
                  className="glass-hover"
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-default)',
                    background: 'var(--bg-secondary)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {/* Avatar initials or picture */}
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt={member.name}
                        style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 700
                        }}
                      >
                        {getInitials(member.name)}
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem', minWidth: 0 }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {member.name}
                      </span>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
                        {member.openTasksCount} open tasks
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.625rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      <span>Workspace Share</span>
                      <span>{percentage}%</span>
                    </div>
                    {/* Share Bar visualizer */}
                    <div
                      style={{
                        height: '6px',
                        borderRadius: '3px',
                        background: 'var(--border-default)',
                        overflow: 'hidden'
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${percentage}%`,
                          background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
                          borderRadius: '3px',
                          transition: 'width 0.4s ease-out'
                        }}
                      />
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
