'use client'

import { useEffect, useState } from 'react'
import { connectSocket } from '@/lib/socket'
import { useAuthStore } from '@/store/auth.store'
import type { Socket } from 'socket.io-client'
import type { ServerToClientEvents, ClientToServerEvents } from '@/types/socket.types'

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>

interface UseSocketOptions {
  /** If false, socket will not connect. Default true. */
  enabled?: boolean
}

interface UseSocketReturn {
  socket: TypedSocket | null
  isConnected: boolean
}

/**
 * useSocket — manages socket connection lifecycle.
 *
 * Connects on mount (when enabled + user is authenticated),
 * disconnects on unmount.
 *
 * Returns the socket instance and connection status.
 */
export function useSocket({ enabled = true }: UseSocketOptions = {}): UseSocketReturn {
  const { accessToken, isInitialized } = useAuthStore()
  const [isConnected, setIsConnected] = useState(false)
  const [socket, setSocket] = useState<TypedSocket | null>(null)

  useEffect(() => {
    if (!enabled || !isInitialized || !accessToken) {
      return
    }

    const s = connectSocket(accessToken)

    const timeoutId = setTimeout(() => {
      setSocket(s)
      setIsConnected(s.connected)
    }, 0)

    const onConnect = () => {
      setIsConnected(true)
      console.log('[socket] connected:', s.id)
    }

    const onDisconnect = (reason: string) => {
      setIsConnected(false)
      console.log('[socket] disconnected:', reason)
    }

    const onConnectError = (err: Error) => {
      console.error('[socket] connect error:', err.message)
    }

    s.on('connect', onConnect)
    s.on('disconnect', onDisconnect)
    s.on('connect_error', onConnectError)

    return () => {
      clearTimeout(timeoutId)
      s.off('connect', onConnect)
      s.off('disconnect', onDisconnect)
      s.off('connect_error', onConnectError)
      setSocket(null)
      setIsConnected(false)
    }
  }, [enabled, isInitialized, accessToken])

  return {
    socket,
    isConnected
  }
}

export default useSocket
