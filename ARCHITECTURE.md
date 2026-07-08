# CollabFlow — System Architecture

**Version:** 1.0  
**Date:** 2026-07-07  

---

## 1. Architecture Overview

CollabFlow follows a **Monorepo Full-Stack Architecture** using Next.js 15 with App Router. The system is split into:

1. **Presentation Layer** — React components, pages, UI
2. **API Layer** — Next.js Route Handlers (REST)
3. **Real-time Layer** — Socket.io WebSocket server
4. **Service Layer** — Business logic
5. **Data Access Layer** — Prisma ORM
6. **Database Layer** — MySQL

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT BROWSER                             │
│                                                                     │
│   ┌──────────────┐    ┌──────────────┐    ┌────────────────────┐   │
│   │  Next.js UI  │    │ TanStack Q.  │    │   Socket.io Client │   │
│   │  (React 19)  │◄──►│  (REST API)  │    │   (Real-time)      │   │
│   └──────┬───────┘    └──────┬───────┘    └────────┬───────────┘   │
└──────────┼────────────────── ┼─────────────────────┼───────────────┘
           │                   │ HTTPS               │ WSS
           │              ┌────▼─────────────────────▼──────────┐
           │              │          VERCEL EDGE                  │
           │              │                                       │
           │              │   ┌───────────────────────────────┐  │
           │              │   │    Next.js API Route Handlers  │  │
           │              │   │    /api/auth/*                 │  │
           │              │   │    /api/workspaces/*           │  │
           │              │   │    /api/projects/*             │  │
           │              │   │    /api/tasks/*                │  │
           │              │   │    /api/messages/*             │  │
           │              │   │    /api/notifications/*        │  │
           │              │   └──────────────┬────────────────┘  │
           │              │                  │                    │
           │              │   ┌──────────────▼────────────────┐  │
           │              │   │       Service Layer            │  │
           │              │   │   AuthService, WorkspaceService│  │
           │              │   │   TaskService, ChatService...  │  │
           │              │   └──────────────┬────────────────┘  │
           │              │                  │                    │
           │              │   ┌──────────────▼────────────────┐  │
           │              │   │       Prisma ORM Client        │  │
           │              │   └──────────────┬────────────────┘  │
           │              └──────────────────┼────────────────────┘
           │                                 │
           │              ┌──────────────────▼────────────────────┐
           │              │         RAILWAY MYSQL DATABASE         │
           │              │                                        │
           │              │   Users, Workspaces, Projects, Tasks   │
           │              │   Messages, Notifications, Activities  │
           │              └────────────────────────────────────────┘
           │
     ┌─────▼──────────────────────────────────────────────┐
     │              SOCKET.IO SERVER                       │
     │              (Next.js API Route or standalone)      │
     │                                                     │
     │   Namespaces:                                       │
     │   /workspace — Presence, Activity                   │
     │   /chat      — Messages, Typing                     │
     │   /tasks     — Live task updates                    │
     │   /notify    — Notification push                    │
     └────────────────────────────────────────────────────┘
```

---

## 2. Request Lifecycle

### REST API Request
```
Client → Next.js Middleware (auth check)
       → API Route Handler
       → Input Validation (Zod)
       → Service Layer (business logic)
       → Prisma (database query)
       → Response (JSON)
       → Socket.io broadcast (if mutation)
```

### Real-time Event
```
Client Action → Socket.io Client emit
              → Socket.io Server receive
              → Validate + Auth check
              → Service Layer (persist if needed)
              → Broadcast to room
              → All connected clients receive
```

---

## 3. Authentication Architecture

```
Registration:
  Client → POST /api/auth/register
         → Validate (Zod)
         → Hash password (bcrypt, 12 rounds)
         → Create User (Prisma)
         → Generate JWT (access + refresh)
         → Return tokens + user

Login:
  Client → POST /api/auth/login
         → Find user by email
         → Compare password (bcrypt)
         → Generate JWT tokens
         → Return tokens + user

Protected Route:
  Client → Request with Authorization: Bearer <token>
         → middleware.ts intercepts
         → Verify JWT (jose)
         → Attach user to request
         → Allow or 401
```

**Token Strategy:**
- **Access Token**: 15 minutes (short-lived, in memory)
- **Refresh Token**: 7 days (HTTP-only cookie)
- **Rotation**: New refresh token on each use

---

## 4. Database Architecture

**Database:** MySQL 8.0  
**ORM:** Prisma  
**Connection:** Prisma Client singleton (to prevent connection pool exhaustion in Next.js)

```
prisma.ts:
  let prisma: PrismaClient
  if (process.env.NODE_ENV === 'production') {
    prisma = new PrismaClient()
  } else {
    if (!global.prisma) global.prisma = new PrismaClient()
    prisma = global.prisma
  }
```

---

## 5. Real-time Architecture (Socket.io)

**Strategy:** Socket.io mounted on Next.js API route `/api/socket`

```
Server Rooms Strategy:
  workspace:{id}   — All workspace members
  project:{id}     — Project collaborators
  task:{id}        — Task watchers
  channel:{id}     — Channel subscribers
  user:{id}        — Personal notifications
  dm:{userId1}:{userId2} — Direct messages
```

**Events:**
```
client→server:
  join_workspace, leave_workspace
  send_message, typing_start, typing_stop
  task_update, task_move
  presence_update (active/idle/offline)

server→client:
  message_received
  task_updated
  user_joined, user_left
  notification_push
  activity_created
  presence_changed
```

---

## 6. Folder Architecture (Feature-based)

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/             # Unauthenticated route group
│   ├── (dashboard)/        # Authenticated route group  
│   └── api/                # REST API endpoints
│
├── components/             # UI components organized by feature
│   ├── ui/                 # Shadcn primitives
│   ├── common/             # Shared across features
│   ├── auth/
│   ├── workspace/
│   ├── project/
│   ├── task/
│   ├── chat/
│   ├── notification/
│   └── analytics/
│
├── hooks/                  # Custom React hooks
├── lib/                    # Core utilities (prisma, auth, socket)
├── services/               # Client-side API call functions
├── store/                  # Zustand global state
├── types/                  # TypeScript interfaces
└── middleware.ts            # Route protection
```

---

## 7. Security Architecture

| Layer | Mechanism |
|-------|-----------|
| Password Storage | bcrypt (cost factor 12) |
| Authentication | JWT (HS256, short TTL) |
| Session | HTTP-only refresh token cookie |
| API Protection | Middleware JWT verification |
| Input Validation | Zod on all API inputs |
| SQL Injection | Prisma parameterized queries |
| XSS | Next.js built-in escaping |
| CSRF | Same-site cookie policy |
| Rate Limiting | Next.js middleware (future) |

---

## 8. State Management Architecture

```
Client State:
  Zustand          → Auth user, UI state (sidebar, theme)
  TanStack Query   → Server data (tasks, projects, messages)
  Socket.io events → Real-time mutations via queryClient.invalidateQueries()

Pattern:
  Socket event received
    → optimistically update Zustand/local state
    → invalidate TanStack Query cache
    → re-fetch from server (eventual consistency)
```

---

## 9. Deployment Architecture

```
┌──────────────┐      ┌──────────────────┐      ┌─────────────────┐
│    GitHub    │─────►│     Vercel       │      │  Railway MySQL  │
│   (main)     │      │  (Next.js App)   │◄────►│   (Database)    │
└──────────────┘      │  - API Routes    │      │                 │
      │               │  - SSR/SSG       │      └─────────────────┘
      │               │  - Edge Middleware│
      │               └──────────────────┘
      │
   CI/CD auto-deploy on push to main
```

---

## 10. Performance Strategy

- **Server Components** for static/data-heavy pages
- **Client Components** only where interactivity needed
- **TanStack Query** for aggressive caching and background refetch
- **Optimistic Updates** for task and message mutations
- **Virtualized lists** for long task/message lists
- **Image Optimization** via Next.js `<Image />`
- **Code Splitting** via Next.js automatic chunking
- **Edge Functions** for auth middleware (Vercel Edge)

---

## 11. API Design Principles

- **REST** (not GraphQL, for simplicity and compatibility)
- Resource-based URLs: `/api/workspaces/:id/projects`
- HTTP methods: GET, POST, PATCH, DELETE
- Consistent response format:
```json
{
  "success": true,
  "data": { ... },
  "message": "Resource created successfully",
  "pagination": { "page": 1, "limit": 20, "total": 100 }
}
```
- Error format:
```json
{
  "success": false,
  "error": "UNAUTHORIZED",
  "message": "You don't have permission to access this resource"
}
```
