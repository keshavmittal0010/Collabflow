'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { UpdateWorkspaceSchema, UpdateWorkspaceSchemaType, InviteMemberSchema, InviteMemberSchemaType } from '@/lib/validations'
import { WorkspaceService } from '@/services/workspace.service'
import { useWorkspaceStore } from '@/store/workspace.store'
import { useAuth } from '@/hooks/useAuth'
import { getInitials } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Info, Settings, Users, UserPlus, Trash, Shield, Link as LinkIcon, Check, Copy } from 'lucide-react'
import Link from 'next/link'

export default function WorkspaceSettingsPage() {
  const router = useRouter()
  const { id } = useParams() as { id: string }
  const { user: currentUser } = useAuth()
  const { fetchWorkspaces, setCurrentWorkspace } = useWorkspaceStore()
  const queryClient = useQueryClient()
  
  const [activeTab, setActiveTab] = useState<'general' | 'members' | 'invites'>('general')
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Fetch workspace details
  const { data: res, isLoading, refetch } = useQuery({
    queryKey: ['workspace', id],
    queryFn: () => WorkspaceService.getWorkspace(id),
    enabled: !!id
  })

  const workspace = res?.success ? res.data : null

  // Verify requester's membership details
  const myMembership = workspace?.members.find((m) => m.userId === currentUser?.id)
  const isOwner = myMembership?.role === 'owner'
  const isAdminOrOwner = myMembership?.role === 'owner' || myMembership?.role === 'admin'

  // React Hook Form for General settings
  const {
    register: registerGeneral,
    handleSubmit: handleSubmitGeneral,
    setValue: setGeneralVal,
    formState: { errors: errorsGeneral }
  } = useForm<UpdateWorkspaceSchemaType>({
    resolver: zodResolver(UpdateWorkspaceSchema)
  })

  // React Hook Form for Invite Member settings
  const {
    register: registerInvite,
    handleSubmit: handleSubmitInvite,
    reset: resetInvite,
    formState: { errors: errorsInvite }
  } = useForm<InviteMemberSchemaType>({
    resolver: zodResolver(InviteMemberSchema),
    defaultValues: {
      email: '',
      role: 'member'
    }
  })

  // Prefill General Settings Form
  useEffect(() => {
    if (workspace) {
      setGeneralVal('name', workspace.name)
      setGeneralVal('slug', workspace.slug)
      setGeneralVal('description', workspace.description || '')
    }
  }, [workspace, setGeneralVal])

  // General settings update mutation
  const updateGeneralMutation = useMutation({
    mutationFn: (data: UpdateWorkspaceSchemaType) => WorkspaceService.updateWorkspace(id, data),
    onSuccess: async (data) => {
      if (data.success) {
        setFeedbackMsg({ type: 'success', text: 'Workspace settings updated successfully!' })
        queryClient.invalidateQueries({ queryKey: ['workspace', id] })
        await fetchWorkspaces() // Refresh sidebar list
      } else {
        setFeedbackMsg({ type: 'error', text: data.message || 'Failed to update workspace' })
      }
    }
  })

  // Workspace delete mutation
  const deleteWorkspaceMutation = useMutation({
    mutationFn: () => WorkspaceService.deleteWorkspace(id),
    onSuccess: async (data) => {
      if (data.success) {
        await fetchWorkspaces()
        setCurrentWorkspace(null)
        router.push('/dashboard')
      } else {
        setFeedbackMsg({ type: 'error', text: data.message || 'Failed to delete workspace' })
      }
    }
  })

  // Invite member mutation
  const inviteMutation = useMutation({
    mutationFn: (data: InviteMemberSchemaType) => WorkspaceService.inviteMember(id, data),
    onSuccess: (data) => {
      if (data.success) {
        setFeedbackMsg({ type: 'success', text: 'Member invitation generated successfully!' })
        resetInvite()
        refetch() // Refetch data to show in invites list
      } else {
        setFeedbackMsg({ type: 'error', text: data.message || 'Failed to generate invitation' })
      }
    }
  })

  // Update member role mutation
  const updateMemberRoleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: string }) =>
      WorkspaceService.updateMemberRole(id, memberId, role),
    onSuccess: (data) => {
      if (data.success) {
        setFeedbackMsg({ type: 'success', text: 'Member role updated successfully!' })
        refetch()
      } else {
        setFeedbackMsg({ type: 'error', text: data.message || 'Failed to update role' })
      }
    }
  })

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => WorkspaceService.removeMember(id, memberId),
    onSuccess: (data) => {
      if (data.success) {
        setFeedbackMsg({ type: 'success', text: 'Member removed successfully!' })
        refetch()
      } else {
        setFeedbackMsg({ type: 'error', text: data.message || 'Failed to remove member' })
      }
    }
  })

  const copyInviteLink = (token: string) => {
    const inviteUrl = `${window.location.origin}/invite/${token}`
    navigator.clipboard.writeText(inviteUrl)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

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
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Loading settings...</span>
      </div>
    )
  }

  if (!res?.success || !workspace) {
    return (
      <div className="card-glass" style={{ padding: '3rem', textAlign: 'center', maxWidth: '500px', margin: '2rem auto' }}>
        <Info size={40} style={{ color: 'var(--color-error)', marginBottom: '1rem' }} />
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Access Denied</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          You do not have access to view settings or settings fail to load.
        </p>
        <Link href={`/workspace/${id}`} style={{ padding: '0.5rem 1rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>
          Back to Workspace
        </Link>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-default)', paddingBottom: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Workspace Settings</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Manage {workspace.name} details, memberships, and invitatons.
          </p>
        </div>
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

      {/* Tabs Layout */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-default)', paddingBottom: '0.5rem' }}>
          <button
            onClick={() => { setActiveTab('general'); setFeedbackMsg(null); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 0.75rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'general' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: activeTab === 'general' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Settings size={16} />
            General
          </button>
          <button
            onClick={() => { setActiveTab('members'); setFeedbackMsg(null); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 0.75rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'members' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: activeTab === 'members' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Users size={16} />
            Members ({workspace.members.length})
          </button>
          {isAdminOrOwner && (
            <button
              onClick={() => { setActiveTab('invites'); setFeedbackMsg(null); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.75rem',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'invites' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                color: activeTab === 'invites' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <UserPlus size={16} />
              Invites
            </button>
          )}
        </div>

        {/* Tab Contents */}
        {activeTab === 'general' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="card-glass" style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.25rem' }}>Workspace Details</h3>
              <form onSubmit={handleSubmitGeneral((data) => updateGeneralMutation.mutate(data))} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <Label htmlFor="ws-name">Workspace Name</Label>
                  <Input id="ws-name" disabled={!isAdminOrOwner || updateGeneralMutation.isPending} {...registerGeneral('name')} />
                  {errorsGeneral.name && <span style={{ fontSize: '0.75rem', color: 'var(--color-error)' }}>{errorsGeneral.name.message}</span>}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <Label htmlFor="ws-slug">URL Slug</Label>
                  <Input id="ws-slug" disabled={!isAdminOrOwner || updateGeneralMutation.isPending} {...registerGeneral('slug')} />
                  {errorsGeneral.slug && <span style={{ fontSize: '0.75rem', color: 'var(--color-error)' }}>{errorsGeneral.slug.message}</span>}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <Label htmlFor="ws-desc">Description</Label>
                  <textarea
                    id="ws-desc"
                    rows={3}
                    disabled={!isAdminOrOwner || updateGeneralMutation.isPending}
                    {...registerGeneral('description')}
                    style={{
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.875rem',
                      fontFamily: 'inherit',
                      outline: 'none',
                      resize: 'none'
                    }}
                  />
                  {errorsGeneral.description && <span style={{ fontSize: '0.75rem', color: 'var(--color-error)' }}>{errorsGeneral.description.message}</span>}
                </div>

                {isAdminOrOwner && (
                  <button
                    type="submit"
                    disabled={updateGeneralMutation.isPending}
                    style={{
                      padding: '0.5rem 1.25rem',
                      background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      color: '#ffffff',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: updateGeneralMutation.isPending ? 'not-allowed' : 'pointer',
                      alignSelf: 'flex-start',
                      boxShadow: 'var(--shadow-glow)'
                    }}
                  >
                    Save Changes
                  </button>
                )}
              </form>
            </div>

            {isOwner && (
              <div className="card-glass" style={{ padding: '2rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-error)', marginBottom: '0.5rem' }}>Danger Zone</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                  Deleting this workspace is permanent. It will delete all members, invites, channels, projects, and tasks under this workspace. This action cannot be undone.
                </p>
                <button
                  onClick={() => {
                    if (confirm('Are you absolutely sure you want to delete this workspace? This cannot be undone.')) {
                      deleteWorkspaceMutation.mutate()
                    }
                  }}
                  disabled={deleteWorkspaceMutation.isPending}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1.25rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: 'var(--radius-md)',
                    color: '#f87171',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: deleteWorkspaceMutation.isPending ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Trash size={16} />
                  Delete Workspace
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'members' && (
          <div className="card-glass" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Workspace Members</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {workspace.members.map((member) => {
                const isTargetOwner = member.role === 'owner'
                const isMe = member.userId === currentUser?.id
                
                // Determine if requesting user can manage target member role
                const canManageRole = isAdminOrOwner && !isTargetOwner && !isMe && (isOwner || member.role !== 'admin')
                const canRemove = isAdminOrOwner && !isTargetOwner && !isMe && (isOwner || member.role !== 'admin')

                return (
                  <div key={member.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-default)', paddingBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
                          color: 'var(--accent-tertiary)'
                        }}
                      >
                        {getInitials(member.user.name)}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                          {member.user.name} {isMe && <span style={{ color: 'var(--text-muted)' }}>(You)</span>}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{member.user.email}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {canManageRole ? (
                        <select
                          value={member.role}
                          onChange={(e) => updateMemberRoleMutation.mutate({ memberId: member.id, role: e.target.value })}
                          disabled={updateMemberRoleMutation.isPending}
                          style={{
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--border-default)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--text-primary)',
                            padding: '0.375rem 0.5rem',
                            fontSize: '0.8125rem',
                            outline: 'none'
                          }}
                        >
                          <option value="admin">Admin</option>
                          <option value="member">Member</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      ) : (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            textTransform: 'capitalize',
                            color: 'var(--text-secondary)',
                            background: 'var(--bg-tertiary)',
                            padding: '0.25rem 0.5rem',
                            borderRadius: 'var(--radius-full)'
                          }}
                        >
                          {member.role}
                        </span>
                      )}

                      {canRemove && (
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to remove ${member.user.name} from the workspace?`)) {
                              removeMemberMutation.mutate(member.id)
                            }
                          }}
                          disabled={removeMemberMutation.isPending}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--color-error)',
                            cursor: 'pointer',
                            padding: '0.25rem'
                          }}
                        >
                          <Trash size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {activeTab === 'invites' && isAdminOrOwner && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Create Invite */}
            <div className="card-glass" style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.25rem' }}>Invite New Member</h3>
              <form onSubmit={handleSubmitInvite((data) => inviteMutation.mutate(data))} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: '220px' }}>
                  <Label htmlFor="invite-email">Email Address</Label>
                  <Input id="invite-email" type="email" placeholder="collaborator@company.com" disabled={inviteMutation.isPending} {...registerInvite('email')} />
                  {errorsInvite.email && <span style={{ fontSize: '0.75rem', color: 'var(--color-error)' }}>{errorsInvite.email.message}</span>}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '120px' }}>
                  <Label htmlFor="invite-role">Role</Label>
                  <select
                    id="invite-role"
                    disabled={inviteMutation.isPending}
                    {...registerInvite('role')}
                    style={{
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      padding: '0.5rem 0.75rem',
                      height: '40px',
                      fontSize: '0.875rem',
                      outline: 'none',
                      width: '100%'
                    }}
                  >
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={inviteMutation.isPending}
                  style={{
                    height: '40px',
                    padding: '0 1.25rem',
                    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    color: '#ffffff',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: inviteMutation.isPending ? 'not-allowed' : 'pointer',
                    boxShadow: 'var(--shadow-glow)'
                  }}
                >
                  Generate Invite
                </button>
              </form>
            </div>

            {/* Pending Invites List */}
            <div className="card-glass" style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.25rem' }}>Active Invitation Links</h3>
              {(!workspace.invites || workspace.invites.length === 0) ? (
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', padding: '1rem 0' }}>
                  No active invitations generated.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {workspace.invites.map((invite) => {
                    const isCopied = copiedToken === invite.token
                    return (
                      <div key={invite.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-default)', paddingBottom: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{invite.email}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            Role: <span style={{ textTransform: 'capitalize' }}>{invite.role}</span> · Expires: {new Date(invite.expiresAt).toLocaleDateString()}
                          </span>
                        </div>

                        <button
                          onClick={() => copyInviteLink(invite.token)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                            padding: '0.375rem 0.75rem',
                            background: isCopied ? 'rgba(34,197,94,0.1)' : 'var(--bg-tertiary)',
                            border: `1px solid ${isCopied ? 'rgba(34,197,94,0.2)' : 'var(--border-default)'}`,
                            borderRadius: 'var(--radius-md)',
                            color: isCopied ? '#4ade80' : 'var(--text-primary)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          {isCopied ? <Check size={12} /> : <Copy size={12} />}
                          {isCopied ? 'Copied Link' : 'Copy Invite Link'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
