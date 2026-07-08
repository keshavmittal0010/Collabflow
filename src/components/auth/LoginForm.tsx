'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { LoginSchema, LoginSchemaType } from '@/lib/validations'
import { useAuth } from '@/hooks/useAuth'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'
  
  const { user, login, isLoggingIn } = useAuth()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      router.push(redirect)
    }
  }, [user, redirect, router])

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '' }
  })

  const onSubmit = async (data: LoginSchemaType) => {
    setErrorMsg(null)
    try {
      const res = await login(data)
      if (res.success) {
        router.push(redirect)
      } else {
        setErrorMsg(res.message || 'Invalid email or password')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred')
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      autoComplete="off"
      style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
    >
      {errorMsg && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#f87171',
            fontSize: '0.8125rem',
            fontWeight: 500
          }}
        >
          {errorMsg}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Label htmlFor="email" style={{ color: 'var(--text-secondary)' }}>
          Email Address
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="name@company.com"
          autoComplete="off"
          disabled={isLoggingIn}
          {...register('email')}
          style={{
            borderColor: errors.email ? 'var(--color-error)' : 'var(--border-default)'
          }}
        />
        {errors.email && (
          <span style={{ fontSize: '0.75rem', color: 'var(--color-error)' }}>
            {errors.email.message}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Label htmlFor="password" style={{ color: 'var(--text-secondary)' }}>
            Password
          </Label>
          <a
            href="/forgot-password"
            style={{
              fontSize: '0.75rem',
              color: 'var(--accent-tertiary)',
              fontWeight: 500
            }}
          >
            Forgot password?
          </a>
        </div>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          disabled={isLoggingIn}
          {...register('password')}
          style={{
            borderColor: errors.password ? 'var(--color-error)' : 'var(--border-default)'
          }}
        />
        {errors.password && (
          <span style={{ fontSize: '0.75rem', color: 'var(--color-error)' }}>
            {errors.password.message}
          </span>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoggingIn}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          padding: '0.75rem',
          borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
          color: '#ffffff',
          border: 'none',
          fontSize: '0.875rem',
          fontWeight: 600,
          cursor: isLoggingIn ? 'not-allowed' : 'pointer',
          opacity: isLoggingIn ? 0.7 : 1,
          transition: 'transform 0.15s, opacity 0.15s',
          boxShadow: 'var(--shadow-glow)'
        }}
      >
        {isLoggingIn ? (
          <>
            <div
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: '#ffffff',
                animation: 'spin 1s linear infinite'
              }}
            />
            Signing in...
          </>
        ) : (
          'Sign In'
        )}
      </button>
    </form>
  )
}
export default LoginForm
