# CollabFlow — Development Roadmap

> A phase-by-phase guide to building CollabFlow from zero to production.
> Updated after every phase.

---

## 🗺️ Overview

| Phase | Name | Status | ETA |
|-------|------|--------|-----|
| **1** | Planning & Architecture | ✅ Complete | Done |
| **2** | Authentication System | ✅ Complete | Done |
| **3** | Workspace Management | ✅ Complete | Done |
| **4** | Projects & Boards | ✅ Complete | Done |
| **5** | Task Management | ✅ Complete | Done |
| **6** | Real-time Collaboration | ✅ Complete | Done |
| **7** | Chat System | ✅ Complete | Done |
| **8** | Notifications | ✅ Complete | Done |
| **9** | Analytics Dashboard | ✅ Complete | Done |
| **10** | Testing & Deployment | ✅ Complete | Done |

---

## ✅ Phase 1 — Planning & Architecture
**Status:** Complete | **Completed:** 2026-07-07

### Deliverables
- [x] Product Requirements Document (PRD.md)
- [x] System Architecture Document (ARCHITECTURE.md)
- [x] Database Design (24 tables, ER diagram, Prisma schema)
- [x] Design System (CSS tokens, animations, glassmorphism)
- [x] Project scaffold (Next.js 16, TypeScript, Tailwind v4)
- [x] All dependencies installed
- [x] Landing page (premium hero, feature grid, CTA)
- [x] TypeScript type definitions (all modules)
- [x] Core utilities (prisma singleton, utils.ts)
- [x] Documentation suite (README, PRD, ARCHITECTURE, DATABASE, CHANGELOG, PROJECT_STATE, CONTINUE_WITH_AI)
- [x] Dev server running clean on `http://localhost:3000`

---

## ✅ Phase 2 — Authentication System
**Status:** Complete | **Completed:** 2026-07-07

### Backend
- [x] Install `@prisma/adapter-mysql` + `mysql2` (replaced by `@prisma/adapter-mariadb` + `mariadb` for Prisma 7 compatibility)
- [x] Create `.env.local` and `.env` with `DATABASE_URL`
- [x] Run `prisma migrate dev --name init` (created and applied all 24 tables)
- [x] `src/lib/auth.ts` — JWT utilities (sign access + refresh tokens with `jose`)
- [x] `src/lib/validations.ts` — Zod schemas for all auth inputs

### API Routes
- [x] `POST /api/auth/register` — Create user, hash password, return tokens
- [x] `POST /api/auth/login` — Verify credentials, return tokens
- [x] `POST /api/auth/logout` — Invalidate refresh token
- [x] `POST /api/auth/refresh` — Rotate refresh token, return new access token
- [x] `GET /api/auth/me` — Return authenticated user profile

### Route Protection
- [x] Update `src/proxy.ts` — Real JWT verification (jose `jwtVerify`)
- [x] Protect `(dashboard)/*` routes → redirect to `/login`
- [x] Redirect logged-in users away from `(auth)/*` routes

### Frontend
- [x] Add `QueryClientProvider` to `src/app/layout.tsx` (wrapped in Providers)
- [x] Install Shadcn UI (`npx shadcn@latest init`)
- [x] `src/store/auth.store.ts` — Zustand: user, accessToken, setUser, clearAuth
- [x] `src/services/auth.service.ts` — Client-side fetch wrappers
- [x] `src/hooks/useAuth.ts` — Custom hook for auth state
- [x] `src/components/auth/LoginForm.tsx` — React Hook Form + Zod
- [x] `src/components/auth/RegisterForm.tsx` — React Hook Form + Zod
- [x] `/login` page — Premium UI with form, error states, loading
- [x] `/register` page — Premium UI with form, error states, loading
- [x] `/forgot-password` page — Email input form
- [x] Post-login redirect to `/dashboard`

### End of Phase 2
- [x] Update README.md, PROJECT_STATE.md, CONTINUE_WITH_AI.md, CHANGELOG.md, ROADMAP.md

---

## ✅ Phase 3 — Workspace Management
**Status:** Complete | **Completed:** 2026-07-07

### Backend
- [x] `POST /api/workspaces` — Create workspace and auto-assign owner role
- [x] `GET /api/workspaces` — List workspaces authenticated user belongs to
- [x] `GET /api/workspaces/[id]` — Retrieve details, project counts, and members
- [x] `PATCH /api/workspaces/[id]` — Update metadata (name, description, slug)
- [x] `DELETE /api/workspaces/[id]` — Delete workspace permanently (restricted to owner)
- [x] `POST /api/workspaces/[id]/invite` — Create secure tokenized invitations
- [x] `GET /api/workspaces/invite/[token]` — Verify validity of invite link
- [x] `POST /api/workspaces/invite/[token]` — Accept invitation and join workspace
- [x] `PATCH /api/workspaces/[id]/members/[memberId]` — Update member roles
- [x] `DELETE /api/workspaces/[id]/members/[memberId]` — Revoke member access

### Frontend
- [x] Workspace creation modal (`WorkspaceModal.tsx`)
- [x] Workspace switcher dropdown (`WorkspaceSwitcher.tsx`)
- [x] Workspace dashboard overview (`dashboard/page.tsx` & `workspace/[id]/page.tsx`)
- [x] Member management panel (modify roles, remove members)
- [x] Settings layout with tabbed configuration (General, Members, Invites)
- [x] Invite acceptance and matching email join flow (`invite/[token]/page.tsx`)

---

## ✅ Phase 4 — Projects & Boards
**Status:** Complete | **Completed:** 2026-07-07

### Backend
- [x] Full CRUD for Projects
- [x] Full CRUD for Boards
- [x] Board columns CRUD (create, rename, reorder, delete)
- [x] Project member management (assigned creator as lead)

### Frontend
- [x] Projects list page (grid/list layouts in workspace detail page)
- [x] Project creation modal (`ProjectModal.tsx`)
- [x] Project settings page
- [x] Board view (horizontal Kanban layout)
- [x] Column header with count + add column interface
- [x] Board tab switcher view

---

## ✅ Phase 5 — Task Management
**Status:** Complete | **Completed:** 2026-07-07 | **Depends on:** Phase 4

### Backend
- [x] `POST /api/projects/[id]/tasks` — Create task (auto-identifier, fractional position)
- [x] `GET /api/projects/[id]/tasks` — List tasks with assignees + counts
- [x] `PATCH /api/tasks/[id]` — Edit task fields + assignee diff
- [x] `PATCH /api/tasks/[id]/move` — Move with fractional index position
- [x] `DELETE /api/tasks/[id]` — Delete task (creator/lead restricted)
- [x] `GET /api/tasks/[id]/comments` — Threaded comment tree
- [x] `POST /api/tasks/[id]/comments` — Create comment (with `parentId` threading)

### Client State
- [x] `src/services/task.service.ts` — API wrappers for all task endpoints
- [x] `src/store/task.store.ts` — Zustand store with optimistic move support

### Frontend
- [x] `TaskCard.tsx` — Priority border stripe, identifier, stacked assignee avatars, due date with overdue indicator
- [x] `TaskCreateInline.tsx` — Expandable inline task creation per column
- [x] `TaskDrawer.tsx` — Full side panel: auto-saving title/description, meta fields, threaded comments
- [x] `BoardColumnComponent.tsx` — Refactored with dnd-kit `SortableContext` + `useDroppable`
- [x] `project/[projectId]/page.tsx` — `DndContext` wrapping, fractional position compute, `DragOverlay` ghost

---

## ✅ Phase 6 — Real-time Collaboration
**Status:** Complete | **Completed:** 2026-07-07 | **Depends on:** Phase 5

### Backend
- [x] Install `socket.io`
- [x] Create custom HTTP + Socket.io Server wrapping Next.js in `server.ts`
- [x] Establish typed server/client socket event contracts (`socket.types.ts`)
- [x] Implement JWT authentication socket middleware in server connection
- [x] Define room logic scopes for workspace/project/user mapping
- [x] Setup global IO singleton helper (`io.ts`) for server REST route access
- [x] Emit socket events from POST/PATCH/DELETE task routes and comment POST routes

### Frontend
- [x] Install `socket.io-client`
- [x] Create `src/lib/socket.ts` lazy client singleton
- [x] Create `src/hooks/useSocket.ts` connection hook
- [x] Create `src/hooks/usePresence.ts` room online/offline presence hook
- [x] Create `src/hooks/useProjectSocket.ts` real-time task board event listener hook
- [x] Design presence indicators (online count + avatar green dots) in project header
- [x] Add real-time task updates (create/update/move/delete) on board page
- [x] Integrate comment typing indicator emits and list display inside TaskDrawer
- [x] Wrap App in custom `SocketConnectionInitializer` inside `Providers.tsx`

---

## ✅ Phase 7 — Chat System
**Status:** Complete | **Completed:** 2026-07-07 | **Depends on:** Phase 6

### Backend
- [x] Channel CRUD API Route (`POST/GET /api/workspaces/[id]/channels`)
- [x] Messages CRUD API Route (`POST/GET /api/channels/[id]/messages`)
- [x] Direct Message (DM) private channels creation trigger
- [x] Sockets thread replies emission over socket rooms
- [x] Emoji Reactions toggler API Route (`POST /api/messages/[id]/reactions`)
- [x] Socket server updates (`channel:join`, `channel:leave`, and `message:typing` broadcasts)

### Frontend
- [x] Slack-style Sidebar Channels switcher mapping public/private rooms
- [x] Workspace Members DMs switchers creating DM channels dynamically
- [x] Main Chat timeline scrolling to bottom with custom avatar coloring
- [x] Emoji reaction selection popovers toggled on hover
- [x] Chat Input box textarea supporting typing socket emits and custom blinking animations
- [x] Right slide-in thread details drawer displaying message replies and dedicated thread input box
- [x] Chat Service and Zustand Chat Store
- [x] useChatSocket client hook

---

## ✅ Phase 8 — Notifications
**Status:** Complete | **Completed:** 2026-07-07 | **Depends on:** Phase 6

### Backend
- [x] Central Notification Helper Service in backend (`createNotification`)
- [x] List Notifications API Route (`GET /api/notifications` with pagination)
- [x] Single Mark Read API Route (`PATCH /api/notifications/[id]/read`)
- [x] Workspace Mark All Read API Route (`PATCH /api/notifications/read-all`)
- [x] Real-time Push via Socket.io (`user:{userId}` room broadcast)
- [x] Scan and notify @mentions in task titles/descriptions, comments, and messages

### Frontend
- [x] Glowing navbar Bell icon showing real-time unread count badges
- [x] Interactive Notification Center dropdown showing recent notifications with type-specific icons
- [x] "Mark all read" workspace mutation triggers
- [x] Deep-linked notifications (clicking redirects user to project board with `?task=taskId` query parameter)
- [x] Project Board auto-open task drawer hook from query params
- [x] Client Notification Service wrapper

---

## ✅ Phase 9 — Analytics Dashboard
**Status:** Complete | **Completed:** 2026-07-07 | **Depends on:** Phase 5

### Backend
- [x] Workspace Analytics endpoint (`GET /api/workspaces/[id]/analytics`)
- [x] Aggregated KPI stats (projects, tasks, completed/open counts)
- [x] Tasks completions velocity timeline (past 14 days completions counts)
- [x] Tasks by member (workload distribution)
- [x] Tasks by priority distribution

### Frontend
- [x] Analytics Tab navigation link in Workspace detail overview header
- [x] Glassmorphic summary stats KPI cards (Total Projects, Total Tasks, Completion Rate)
- [x] Premium interactive SVG Project Velocity line chart
- [x] CSS task priorities progress visualizer
- [x] Workspace team workload distribution metrics panel displaying member open tasks counts and percentages

---

## ✅ Phase 10 — Testing & Production Deployment
**Status:** Complete | **Completed:** 2026-07-07 | **Depends on:** All phases

### Testing
- [x] Configure Vitest test runner setup (`vitest.config.ts`)
- [x] Write Unit tests for encryption helpers, initials extractions, slugifiers, and sizing indicators (`utils.test.ts`)
- [x] Write Unit tests verifying Jose JWT Access/Refresh tokens signatures and verification decodes (`auth.test.ts`)
- [x] Configure Playwright E2E browser test runner setup (`playwright.config.ts`)
- [x] Write E2E test covering landing load, registration auto-redirects, and form submits (`auth-flow.spec.ts`)

### Deployment
- [x] Verify local & production Database migrations schema sync status (`npx prisma migrate status` passes)
- [x] Confirm clean Next.js build compilation (`npm run build` passes with zero compiler warnings)
- [x] Establish deployment walkthrough details documentation suite

---

## 🎯 Feature Priority Matrix

| Feature | Priority | Phase | Complexity |
|---------|----------|-------|------------|
| Auth (JWT) | 🔴 Critical | 2 | Medium |
| Workspace create/invite | 🔴 Critical | 3 | Medium |
| Kanban board | 🔴 Critical | 4 | High |
| Task CRUD | 🔴 Critical | 5 | High |
| Real-time updates | 🔴 Critical | 6 | High |
| Chat channels | 🟠 High | 7 | High |
| Notifications | 🟠 High | 8 | Medium |
| Analytics | 🟡 Medium | 9 | Medium |
| File uploads | 🟡 Medium | 5 | Low |
| Collaborative docs | 🟢 Low | Future | Very High |
| Live cursors | 🟢 Low | Future | Very High |
| Mobile app | 🟢 Low | Future | Very High |
