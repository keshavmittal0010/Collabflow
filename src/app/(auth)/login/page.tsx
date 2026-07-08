import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata: Metadata = {
  title: 'Sign In — CollabFlow',
  description: 'Sign in to your CollabFlow workspace',
}

export default function LoginPage() {
  return (
    <div
      style={{
        maxWidth: '400px',
        margin: '0 auto',
      }}
    >
      <div className="card-glass" style={{ padding: '2.5rem' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6D8196, #8da0b0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              margin: '0 auto 1rem',
              boxShadow: 'var(--shadow-glow)'
            }}
          >
            ⚡
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.03em' }}>
            Welcome back
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Sign in to your CollabFlow account
          </p>
        </div>

        {/* Real LoginForm inside Suspense */}
        <Suspense fallback={
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                border: '2px solid var(--border-default)',
                borderTopColor: 'var(--accent-primary)',
                animation: 'spin 1s linear infinite'
              }}
            />
          </div>
        }>
          <LoginForm />
        </Suspense>

        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '1.5rem' }}>
          Don&apos;t have an account?{' '}
          <Link href="/register" style={{ color: 'var(--accent-tertiary)', fontWeight: 500 }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
