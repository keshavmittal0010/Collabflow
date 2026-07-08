/**
 * src/lib/socket.ts
 *
 * Lazy singleton for the Socket.io client.
 * Only ever creates ONE connection per browser session.
 * Call getSocket() anywhere in a client component/hook.
 *
 * The socket authenticates via JWT passed in handshake auth,
 * which the custom server.ts middleware verifies with jose.
 */
import { io, Socket } from 'socket.io-client'
import type { ServerToClientEvents, ClientToServerEvents } from '@/types/socket.types'

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>

let socket: TypedSocket | null = null

/**
 * Returns the singleton socket, creating it on first call.
 * Must only be called in browser context (client components / useEffect).
 */
export function getSocket(accessToken?: string): TypedSocket {
  if (!socket || !socket.connected) {
    socket = io({
      // Connect to same origin as the page (custom server on port 3000)
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: {
        token: accessToken || ''
      }
    })
  }

  // Update token if provided (e.g., after silent refresh)
  if (accessToken && socket.auth) {
    (socket.auth as { token: string }).token = accessToken
  }

  return socket
}

/**
 * Connect the socket with the current access token.
 * Safe to call multiple times — noop if already connected.
 */
export function connectSocket(accessToken: string): TypedSocket {
  const s = getSocket(accessToken)
  if (!s.connected) {
    s.connect()
  }
  return s
}

/**
 * Cleanly disconnect the socket and remove the singleton.
 * Call this on logout.
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
