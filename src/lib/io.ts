/**
 * src/lib/io.ts
 *
 * Server-only module that holds a reference to the Socket.io Server instance.
 * API routes import getIO() to broadcast events after mutations.
 *
 * The global `globalThis.__io` trick keeps the singleton across hot-reloads
 * in Next.js dev mode, just like the Prisma singleton pattern.
 */
import type { Server } from 'socket.io'
import type { ServerToClientEvents, ClientToServerEvents, SocketData } from '@/types/socket.types'

type IO = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>

declare global {
  // eslint-disable-next-line no-var
  var __io: IO | undefined
}

/**
 * Store the Socket.io Server instance so API routes can access it.
 * Called once from server.ts after io is created.
 */
export function setIO(io: IO): void {
  globalThis.__io = io
}

/**
 * Returns the Socket.io Server instance.
 * Returns null if the server has not been initialized yet
 * (e.g., during `next build` or cold start before server.ts runs).
 */
export function getIO(): IO | null {
  return globalThis.__io ?? null
}
