'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { UpdateProfileSchema, UpdateProfileSchemaType } from '@/lib/validations'
import { AuthService } from '@/services/auth.service'
import { useAuth } from '@/hooks/useAuth'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Settings, Info, Check, Shield } from 'lucide-react'

const TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (New York)' },
  { value: 'America/Chicago', label: 'Central Time (Chicago)' },
  { value: 'America/Denver', label: 'Mountain Time (Denver)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (Los Angeles)' },
  { value: 'Europe/London', label: 'London / GMT' },
  { value: 'Europe/Paris', label: 'Central European Time (Paris)' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (Kolkata)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (Tokyo)' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (Sydney)' }
]

export default function ProfileSettingsPage() {
  const { user } = useAuth()
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<UpdateProfileSchemaType>({
    resolver: zodResolver(UpdateProfileSchema),
    defaultValues: {
      name: '',
      bio: '',
      timezone: 'UTC',
      theme: 'system',
      avatarUrl: ''
    }
  })

  // Pre-fill user data when loaded
  useEffect(() => {
    if (user) {
      setValue('name', user.name)
      setValue('bio', user.bio || '')
      setValue('timezone', user.timezone || 'UTC')
      setValue('theme', user.theme || 'system')
      setValue('avatarUrl', user.avatarUrl || '')
    }
  }, [user, setValue])

  // Profile update mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateProfileSchemaType) => AuthService.updateProfile(data),
    onSuccess: (res) => {
      if (res.success) {
        setFeedbackMsg({ type: 'success', text: 'Your profile settings have been updated successfully!' })
        // Clear message after 3s
        setTimeout(() => setFeedbackMsg(null), 3000)
      } else {
        setFeedbackMsg({ type: 'error', text: res.message || 'Failed to update profile settings.' })
      }
    },
    onError: (err: any) => {
      setFeedbackMsg({ type: 'error', text: err.message || 'An unexpected error occurred.' })
    }
  })

  const onSubmit = (data: UpdateProfileSchemaType) => {
    setFeedbackMsg(null)
    updateMutation.mutate(data)
  }

  if (!user) {
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
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Loading profile details...</span>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header Panel */}
      <div
        className="card-glass"
        style={{
          padding: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem'
        }}
      >
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
          <Settings size={24} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Profile Settings</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Manage your personal profile, display metadata, preference themes, and configurations.
          </p>
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

      {/* Main Settings Panel */}
      <div className="card-glass" style={{ padding: '2.5rem' }}>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <User size={18} style={{ color: 'var(--accent-primary)' }} />
            Personal Details
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            {/* Full Name */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Label htmlFor="prof-name">Full Name</Label>
              <Input id="prof-name" placeholder="Alex Morgan" disabled={updateMutation.isPending} {...register('name')} />
              {errors.name && <span style={{ fontSize: '0.75rem', color: 'var(--color-error)' }}>{errors.name.message}</span>}
            </div>

            {/* Email (Read-Only) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Label htmlFor="prof-email">Email Address</Label>
              <Input
                id="prof-email"
                value={user.email}
                disabled={true}
                style={{
                  background: 'var(--bg-tertiary)',
                  cursor: 'not-allowed',
                  opacity: 0.7
                }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Shield size={12} /> Contact workspace admin to change email.
              </span>
            </div>
          </div>

          {/* Avatar URL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Label htmlFor="prof-avatar">Avatar Image URL</Label>
            <Input
              id="prof-avatar"
              placeholder="https://example.com/avatar.jpg"
              disabled={updateMutation.isPending}
              {...register('avatarUrl')}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Provide a web link to your profile photo (supports Unsplash, GitHub avatars, Gravatar).
            </span>
            {errors.avatarUrl && <span style={{ fontSize: '0.75rem', color: 'var(--color-error)' }}>{errors.avatarUrl.message}</span>}
          </div>

          {/* Bio */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Label htmlFor="prof-bio">Bio</Label>
            <textarea
              id="prof-bio"
              rows={4}
              placeholder="Tell your team about yourself..."
              disabled={updateMutation.isPending}
              {...register('bio')}
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                padding: '0.625rem 0.75rem',
                fontSize: '0.875rem',
                fontFamily: 'inherit',
                outline: 'none',
                resize: 'vertical'
              }}
            />
            {errors.bio && <span style={{ fontSize: '0.75rem', color: 'var(--color-error)' }}>{errors.bio.message}</span>}
          </div>

          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', marginBottom: '0.5rem' }}>
            <Settings size={18} style={{ color: 'var(--accent-secondary)' }} />
            Preferences
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            {/* Timezone */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Label htmlFor="prof-tz">Timezone</Label>
              <select
                id="prof-tz"
                disabled={updateMutation.isPending}
                {...register('timezone')}
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
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
              {errors.timezone && <span style={{ fontSize: '0.75rem', color: 'var(--color-error)' }}>{errors.timezone.message}</span>}
            </div>

            {/* Theme Preference */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Label htmlFor="prof-theme">Theme Preference</Label>
              <select
                id="prof-theme"
                disabled={updateMutation.isPending}
                {...register('theme')}
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
                <option value="system">System Default</option>
                <option value="dark">Dark Theme</option>
                <option value="light">Light Theme</option>
              </select>
              {errors.theme && <span style={{ fontSize: '0.75rem', color: 'var(--color-error)' }}>{errors.theme.message}</span>}
            </div>
          </div>

          <div style={{ height: '1px', background: 'var(--border-default)', margin: '1rem 0' }} />

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.625rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                color: '#ffffff',
                border: 'none',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: updateMutation.isPending ? 'not-allowed' : 'pointer',
                opacity: updateMutation.isPending ? 0.7 : 1,
                boxShadow: 'var(--shadow-glow)',
                transition: 'all 0.15s ease'
              }}
            >
              {updateMutation.isPending ? (
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
                  Saving...
                </>
              ) : (
                <>
                  <Check size={16} /> Save Changes
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
