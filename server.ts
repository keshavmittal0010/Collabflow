/**
 * server.ts — CollabFlow custom Next.js + Socket.io server
 *
 * This file replaces `next dev` / `next start` as the entry point.
 * It boots Next.js inside a plain http.createServer(), then attaches
 * Socket.io to that same server so both HTTP (Next.js) and WebSocket
 * traffic share port 3000.
 *
 * package.json scripts:
 *   dev:   tsx server.ts
 *   start: NODE_ENV=production tsx server.ts
 *   build: next build  (unchanged)
 */

import { createServer } from 'http'
import next from 'next'
import { Server, Socket } from 'socket.io'
import { jwtVerify } from 'jose'
import { setIO } from './src/lib/io'
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from './src/types/socket.types'

const port = parseInt(process.env.PORT || '3000', 10)
const dev = process.env.NODE_ENV !== 'production'

// ─── Socket.io singleton ─────────────────────────────────────────────────────
let io: Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>

export function getIO() {
  if (!io) throw new Error('Socket.io server not initialized yet')
  return io
}

// ─── Boot ────────────────────────────────────────────────────────────────────
async function main() {
  const app = next({ dev, port })
  const handle = app.getRequestHandler()

  await app.prepare()

  const httpServer = createServer((req, res) => {
    handle(req, res)
  })

  // ─── Attach Socket.io ─────────────────────────────────────────────────────
  io = new Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${port}`,
      credentials: true
    },
    // Use WebSocket with polling fallback
    transports: ['websocket', 'polling']
  })

  // Register io globally so API routes can emit events via getIO()
  setIO(io)

  // ─── JWT auth middleware ──────────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined
      if (!token) {
        return next(new Error('Authentication required'))
      }

      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')
      const { payload } = await jwtVerify(token, secret)

      if (!payload.sub) {
        return next(new Error('Invalid token'))
      }

      // Attach user info to socket for use in event handlers
      socket.data.userId = payload.sub as string
      socket.data.userName = (payload.name as string) || 'Unknown'
      socket.data.userEmail = (payload.email as string) || ''

      next()
    } catch {
      next(new Error('Invalid or expired token'))
    }
  })

  // ─── Connection handler ───────────────────────────────────────────────────
  io.on('connection', (socket) => {
    const { userId, userName } = socket.data
    console.log(`[socket] connected: ${userId} (${userName}) — ${socket.id}`)

    // ── Room management ──────────────────────────────────────────────────────

    socket.on('project:join', ({ projectId }: { projectId: string }) => {
      const room = `project:${projectId}`
      socket.join(room)
      console.log(`[socket] ${userName} joined ${room}`)

      // Announce presence to all others in the room
      socket.to(room).emit('user:online', {
        userId,
        name: userName
      })

      // Get list of all users currently in this room
      const socketsInRoom = io.sockets.adapter.rooms.get(room)
      const onlineUserIds: string[] = []
      if (socketsInRoom) {
        for (const sid of socketsInRoom) {
          const s = io.sockets.sockets.get(sid)
          if (s?.data.userId && !onlineUserIds.includes(s.data.userId)) {
            onlineUserIds.push(s.data.userId)
          }
        }
      }
      // Send current presence snapshot to the joining socket
      socket.emit('presence:update', onlineUserIds)
    })

    socket.on('project:leave', ({ projectId }: { projectId: string }) => {
      const room = `project:${projectId}`
      socket.leave(room)
      socket.to(room).emit('user:offline', { userId })
    })

    // ── Workspace room ───────────────────────────────────────────────────────
    socket.on('workspace:join', ({ workspaceId }: { workspaceId: string }) => {
      socket.join(`workspace:${workspaceId}`)
    })

    socket.on('workspace:leave', ({ workspaceId }: { workspaceId: string }) => {
      socket.leave(`workspace:${workspaceId}`)
    })

    // ── Channel room ──────────────────────────────────────────────────────────
    socket.on('channel:join', ({ channelId }: { channelId: string }) => {
      const room = `channel:${channelId}`
      socket.join(room)
      console.log(`[socket] ${userName} joined channel ${room}`)
    })

    socket.on('channel:leave', ({ channelId }: { channelId: string }) => {
      const room = `channel:${channelId}`
      socket.leave(room)
    })

    socket.on(
      'message:typing',
      ({ channelId, isTyping }: { channelId: string; isTyping: boolean }) => {
        socket.to(`channel:${channelId}`).emit('message:typing' as any, {
          channelId,
          userId,
          name: userName,
          isTyping
        })
      }
    )

    // ── User personal room (for notifications) ───────────────────────────────
    socket.join(`user:${userId}`)

    // ── Comment typing indicators ────────────────────────────────────────────
    socket.on(
      'comment:typing',
      ({ taskId, projectId, isTyping }: { taskId: string; projectId: string; isTyping: boolean }) => {
        socket.to(`project:${projectId}`).emit('comment:typing', {
          taskId,
          userId,
          name: userName,
          isTyping
        })
      }
    )

    // ── Disconnect ───────────────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      console.log(`[socket] disconnected: ${userId} — ${reason}`)

      // Notify all rooms this socket was in
      for (const room of socket.rooms) {
        if (room.startsWith('project:')) {
          socket.to(room).emit('user:offline', { userId })
        }
      }
    })
  })

  // ─── Start listening ──────────────────────────────────────────────────────
  httpServer.listen(port, () => {
    console.log(`\n> CollabFlow ready on http://localhost:${port}`)
    console.log(`> Socket.io attached`)
    console.log(`> Mode: ${dev ? 'development' : 'production'}\n`)
  })
}

main().catch((err) => {
  console.error('Server failed to start:', err)
  process.exit(1)
})
