'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { WorkspaceService } from '@/services/workspace.service'
import { useAuth } from '@/hooks/useAuth'
import { useWorkspaceStore } from '@/store/workspace.store'
import { Info, ShieldAlert, CheckCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function InviteAcceptancePage() {
  const router = useRouter()
  const { token } = useParams() as { token: string }
  const { isAuthenticated, user: currentUser } = useAuth()
  const { fetchWorkspaces, setCurrentWorkspace } = useWorkspaceStore()
  const queryClient = useQueryClient()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Verify invitation details
  const { data: res, isLoading, error } = useQuery({
    queryKey: ['invite-verify', token],
    queryFn: () => WorkspaceService.verifyInvite(token),
    enabled: !!token
  })

  const invite = res?.success ? res.data : null

  // Mutation to accept invitation
  const acceptMutation = useMutation({
    mutationFn: () => WorkspaceService.acceptInvite(token),
    onSuccess: async (acceptRes) => {
      if (acceptRes.success) {
        // Refresh local workspaces list
        await fetchWorkspaces()
        queryClient.invalidateQueries({ queryKey: ['workspace', acceptRes.data.workspaceId] })
        
        // Navigate to the newly joined workspace
        router.push(`/workspace/${acceptRes.data.workspaceId}`)
      } else {
        setErrorMsg(acceptRes.message || 'Failed to accept invitation')
      }
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'An unexpected error occurred')
    }
  })

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', gap: '1rem' }}>
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
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Verifying invitation...</span>
      </div>
    )
  }

  if (error || !res?.success || !invite) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '2rem' }}>
        <div className="card-glass" style={{ padding: '3rem', textAlign: 'center', maxWidth: '480px', width: '100%' }}>
          <ShieldAlert size={40} style={{ color: 'var(--color-error)', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Invalid Invitation</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            {res?.message || 'This invitation link is invalid, expired, or has already been accepted.'}
          </p>
          <Link href="/" style={{ display: 'inline-block', padding: '0.625rem 1.25rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>
            Go to Landing Page
          </Link>
        </div>
      </div>
    )
  }

  // Enforce logged in email matching invite email
  const isEmailMatching = currentUser?.email.toLowerCase() === invite.email.toLowerCase()

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '2rem' }}>
      <div className="card-glass" style={{ padding: '3rem', maxWidth: '480px', width: '100%', textAlign: 'center' }}>
        {/* Logo Icon */}
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            margin: '0 auto 1.5rem',
            boxShadow: 'var(--shadow-glow)'
          }}
        >
          ⚡
        </div>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Join Workspace</h2>
        
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2rem' }}>
          <strong>{invite.sender.name}</strong> has invited you to join <strong>{invite.workspace.name}</strong> as a{' '}
          <span style={{ textTransform: 'capitalize', fontWeight: 600, color: 'var(--accent-tertiary)' }}>{invite.role}</span>.
        </p>

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
              marginBottom: '1.5rem',
              textAlign: 'left'
            }}
          >
            {errorMsg}
          </div>
        )}

        {!isAuthenticated ? (
          /* Case 1: Guest User */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid var(--border-default)', fontSize: '0.8125rem', color: 'var(--text-secondary)', textAlign: 'left', lineHeight: 1.5 }}>
              This invite was sent to <strong>{invite.email}</strong>. Please sign in or register with this email to accept and join.
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <Link
                href={`/login?redirect=/invite/${token}`}
                style={{
                  flex: 1,
                  padding: '0.625rem',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 600
                }}
              >
                Sign In
              </Link>
              <Link
                href={`/register?redirect=/invite/${token}`}
                style={{
                  flex: 1,
                  padding: '0.625rem',
                  background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                  borderRadius: 'var(--radius-md)',
                  color: '#ffffff',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  boxShadow: 'var(--shadow-glow)'
                }}
              >
                Sign Up
              </Link>
            </div>
          </div>
        ) : !isEmailMatching ? (
          /* Case 2: Logged in email mismatch */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.8125rem', color: '#f87171', textAlign: 'left', lineHeight: 1.5 }}>
              This invite was sent to <strong>{invite.email}</strong>, but you are currently signed in as <strong>{currentUser?.email}</strong>. Please log out and sign in with the correct email.
            </div>
            
            <Link
              href="/login"
              style={{
                display: 'inline-block',
                padding: '0.625rem 1.25rem',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: 600
              }}
            >
              Sign in with another account
            </Link>
          </div>
        ) : (
          /* Case 3: Logged in user matches */
          <button
            onClick={() => acceptMutation.mutate()}
            disabled={acceptMutation.isPending}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              width: '100%',
              padding: '0.75rem',
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              color: '#ffffff',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: acceptMutation.isPending ? 'not-allowed' : 'pointer',
              opacity: acceptMutation.isPending ? 0.7 : 1,
              boxShadow: 'var(--shadow-glow)'
            }}
          >
            {acceptMutation.isPending ? (
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
                Joining...
              </>
            ) : (
              <>
                Accept Invitation & Join
                <ArrowRight size={16} />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
