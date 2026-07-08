'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { RegisterSchema, RegisterSchemaType } from '@/lib/validations'
import { useAuth } from '@/hooks/useAuth'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function RegisterForm() {
  const router = useRouter()
  const { user, register: registerUser, isRegistering } = useAuth()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterSchemaType>({
    resolver: zodResolver(RegisterSchema)
  })

  const onSubmit = async (data: RegisterSchemaType) => {
    setErrorMsg(null)
    try {
      const res = await registerUser(data)
      if (res.success) {
        router.push('/dashboard')
      } else {
        setErrorMsg(res.message || 'Registration failed')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
        <Label htmlFor="name" style={{ color: 'var(--text-secondary)' }}>
          Full Name
        </Label>
        <Input
          id="name"
          type="text"
          placeholder="John Doe"
          disabled={isRegistering}
          {...register('name')}
          style={{
            borderColor: errors.name ? 'var(--color-error)' : 'var(--border-default)'
          }}
        />
        {errors.name && (
          <span style={{ fontSize: '0.75rem', color: 'var(--color-error)' }}>
            {errors.name.message}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Label htmlFor="email" style={{ color: 'var(--text-secondary)' }}>
          Email Address
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="name@company.com"
          disabled={isRegistering}
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
        <Label htmlFor="password" style={{ color: 'var(--text-secondary)' }}>
          Password
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          disabled={isRegistering}
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Label htmlFor="confirmPassword" style={{ color: 'var(--text-secondary)' }}>
          Confirm Password
        </Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="••••••••"
          disabled={isRegistering}
          {...register('confirmPassword')}
          style={{
            borderColor: errors.confirmPassword ? 'var(--color-error)' : 'var(--border-default)'
          }}
        />
        {errors.confirmPassword && (
          <span style={{ fontSize: '0.75rem', color: 'var(--color-error)' }}>
            {errors.confirmPassword.message}
          </span>
        )}
      </div>

      <button
        type="submit"
        disabled={isRegistering}
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
          cursor: isRegistering ? 'not-allowed' : 'pointer',
          opacity: isRegistering ? 0.7 : 1,
          transition: 'transform 0.15s, opacity 0.15s',
          boxShadow: 'var(--shadow-glow)'
        }}
      >
        {isRegistering ? (
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
            Creating account...
          </>
        ) : (
          'Create Account'
        )}
      </button>
    </form>
  )
}
export default RegisterForm
