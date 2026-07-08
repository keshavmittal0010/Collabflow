'use client'

import { useEffect, useState, useRef } from 'react'
import { getSocket } from '@/lib/socket'
import type { UserPresencePayload } from '@/types/socket.types'

interface UsePresenceReturn {
  /** Set of user IDs currently online in the joined room */
  onlineUserIds: Set<string>
  isTracking: boolean
}

/**
 * usePresence — tracks which users are online in a project/workspace room.
 *
 * Listens to:
 *   - presence:update  → initial snapshot of online user IDs
 *   - user:online      → adds a user to the online set
 *   - user:offline     → removes a user from the online set
 *
 * @param enabled - whether to start tracking (use false until socket is ready)
 */
export function usePresence(enabled = true): UsePresenceReturn {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set())
  const [isTracking, setIsTracking] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    if (!enabled) return

    let s: ReturnType<typeof getSocket>
    try {
      s = getSocket()
    } catch {
      // Socket not yet initialized — will retry on next render
      return
    }

    const timeoutId = setTimeout(() => {
      setIsTracking(true)
    }, 0)

    const handlePresenceUpdate = (userIds: string[]) => {
      if (!mountedRef.current) return
      setOnlineUserIds(new Set(userIds))
    }

    const handleUserOnline = ({ userId }: UserPresencePayload) => {
      if (!mountedRef.current) return
      setOnlineUserIds((prev) => new Set([...prev, userId]))
    }

    const handleUserOffline = ({ userId }: { userId: string }) => {
      if (!mountedRef.current) return
      setOnlineUserIds((prev) => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
    }

    s.on('presence:update', handlePresenceUpdate)
    s.on('user:online', handleUserOnline)
    s.on('user:offline', handleUserOffline)

    return () => {
      clearTimeout(timeoutId)
      s.off('presence:update', handlePresenceUpdate)
      s.off('user:online', handleUserOnline)
      s.off('user:offline', handleUserOffline)
      setIsTracking(false)
    }
  }, [enabled])

  return { onlineUserIds, isTracking }
}

export default usePresence
