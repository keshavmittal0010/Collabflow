# CollabFlow — Changelog

All notable changes to CollabFlow are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

---

## [0.1.0] — 2026-07-07 — Phase 1: Planning & Architecture ✅

### Summary
Complete project foundation: scaffolding, design system, database schema, documentation suite, landing page, and all TypeScript type definitions.

---

### 🆕 Added

#### Project Scaffold
- Next.js 16.2.10 project created with TypeScript, Tailwind v4, ESLint, App Router, `src/` directory, `@/*` import alias
- All runtime dependencies installed (see `package.json`)
- All dev dependencies installed

#### Documentation Suite (Mandatory Files)
- `README.md` — Full project overview, tech stack, folder structure, setup guide, roadmap
- `PRD.md` — Product Requirements Document (10 sections, user personas, features, non-functional requirements, milestones)
- `ARCHITECTURE.md` — System architecture with ASCII diagrams: request lifecycle, auth flow, real-time design, deployment, state management, security
- `ROADMAP.md` — Phase-by-phase development roadmap with feature breakdown
- `docs/DATABASE.md` — Complete database design: ER diagram (ASCII), all 24 table definitions in SQL, relationship table, normalization notes, index strategy
- `PROJECT_STATE.md` — Phase tracking document with exact file inventory, dependency list, known issues
- `CONTINUE_WITH_AI.md` — AI session continuation context (complete project state for handoff)
- `CHANGELOG.md` — This file
- `.env.example` — Environment variable template with all required variables

#### Database Schema (`prisma/schema.prisma`)
Designed and validated 24 Prisma models:
- **Auth:** `User`, `RefreshToken`
- **Workspace:** `Workspace`, `WorkspaceMember`, `WorkspaceInvite`
- **Team:** `Team`, `TeamMember`
- **Project:** `Project`, `ProjectMember`
- **Board:** `Board`, `BoardColumn`
- **Task:** `Task`, `TaskAssignee`, `Label`, `TaskLabel`
- **Comment:** `Comment`
- **Chat:** `Channel`, `ChannelMember`, `Message`, `Reaction`
- **Files:** `Attachment`
- **Docs:** `Document`
- **System:** `Notification`, `ActivityLog`

Prisma client generated successfully. All relations validated.

#### Prisma 7 Configuration (`prisma.config.ts`)
- Created `prisma.config.ts` (required by Prisma 7 — replaces `url` field in `schema.prisma`)
- Configured for MySQL adapter

#### Design System (`src/app/globals.css`)
- 400+ line CSS design system
- CSS custom properties: backgrounds, brand colors, text, borders, glass, shadows, radius, transitions
- Glassmorphism utilities: `.glass`, `.glass-hover`, `.card-glass`
- Gradient utilities: `.gradient-text`, `.gradient-mesh`, `.gradient-primary`
- Glow utilities: `.glow`, `.glow-strong`, `.glow-text`
- Badge system: `.badge`, `.badge-primary`, `.badge-success`, `.badge-warning`, `.badge-error`
- Animation keyframes: `fadeIn`, `fadeInUp`, `fadeInDown`, `scaleIn`, `slideInRight`, `slideInLeft`, `pulse-glow`, `shimmer`, `spin`
- Staggered animation support
- Skeleton loading
- Priority color classes
- Status dot indicators
- Custom scrollbar styling

#### Application Files
- `src/app/layout.tsx` — Root layout with SEO metadata, viewport, Open Graph, Twitter Card, Google Fonts
- `src/app/page.tsx` — Premium landing page with hero, mock Kanban dashboard, feature grid, tech stack, CTA sections, footer
- `src/app/(auth)/layout.tsx` — Auth route group layout (centered, gradient mesh)
- `src/app/(auth)/login/page.tsx` — Login page stub (layout complete, form in Phase 2)
- `src/app/(auth)/register/page.tsx` — Register page stub (layout complete, form in Phase 2)
- `src/app/(dashboard)/layout.tsx` — Dashboard layout stub (sidebar + main, Phase 2)
- `src/proxy.ts` — Route protection proxy (placeholder — real JWT check in Phase 2)
- `next.config.ts` — Next.js config: image domains, security headers

#### Library Files
- `src/lib/prisma.ts` — Prisma singleton pattern (prevents multiple clients in Next.js dev)
- `src/lib/utils.ts` — 15+ utility functions: `cn()`, `formatDate()`, `formatRelativeTime()`, `getInitials()`, `formatFileSize()`, `slugify()`, `getColorFromString()`, `truncate()`, `debounce()`, `apiError()`, `apiSuccess()`, `isValidEmail()`, `generateIdentifier()`

#### TypeScript Types
- `src/types/auth.types.ts` — `User`, `AuthUser`, `JwtPayload`, `AuthTokens`, `AuthResponse`, `ApiSuccess`, `ApiError`, `ApiResponse`, `Pagination`, `RegisterInput`, `LoginInput`
- `src/types/workspace.types.ts` — `Workspace`, `WorkspaceMember`, `WorkspaceWithMembers`, `WorkspaceInvite`, `Team`, `TeamMember`, `TeamWithMembers`
- `src/types/project.types.ts` — `Project`, `ProjectMember`, `Board`, `BoardColumn`, `BoardWithColumns`, `Task`, `TaskAssignee`, `Label`, `TaskWithDetails`, `Comment`
- `src/types/socket.types.ts` — `Channel`, `ChannelMember`, `Message`, `Reaction`, `Attachment`, `TypingUser`, `PresenceUpdate`, `TaskUpdate`, `NotificationPayload`, `SocketRoom`

---

### 🔧 Fixed (During Phase 1)

| Issue | Fix |
|-------|-----|
| `prisma.config.ts` had TypeScript errors (earlyAccess not in type, missing adapter-mysql) | Replaced with clean placeholder; full adapter setup documented in comments for Phase 2 |
| `middleware.ts` deprecated in Next.js 16 | Renamed to `src/proxy.ts`, function renamed to `proxy` |
| Google Fonts `@import` in CSS fails with Tailwind v4 PostCSS | Moved to `<link>` tags in `layout.tsx` |
| Prisma schema `url` field error in Prisma 7 | Moved DATABASE_URL to `prisma.config.ts` |
| Prisma ambiguous Notification→User relation | Added `@relation("NotificationRecipient")` and `@relation("NotificationActor")` named relations |
| Missing back-relations on User model for Notification | Added `notifications` and `actorNotifications` with named relations |
| `prisma format` auto-fixed missing opposite relations on Team model | Auto-resolved |

---

### 📦 Dependencies Added

```
Runtime: @hookform/resolvers, @prisma/client, @tanstack/react-query,
         @tanstack/react-query-devtools, bcryptjs, class-variance-authority,
         clsx, framer-motion, jose, lucide-react, prisma, react-hook-form,
         tailwind-merge, zod, zustand

Dev: @types/bcryptjs, @tailwindcss/postcss, tailwindcss, typescript,
     @types/node, @types/react, @types/react-dom, eslint, eslint-config-next
```

---

### ⚙️ Technical Decisions Made

| Decision | Rationale |
|----------|-----------|
| Custom JWT (jose) not NextAuth | Full control over token strategy, no 3rd-party auth complexity |
| MySQL not PostgreSQL | Project specification requirement |
| Prisma ORM | Type safety, migrations, excellent DX |
| Zustand for global state | Lightweight, no boilerplate vs Redux |
| TanStack Query for server state | Best-in-class caching + real-time invalidation |
| Fractional indexing for task order | No reordering full arrays on drag-drop |
| CUID for primary keys | Non-guessable, URL-safe, no collisions |
| Dark-first design | Modern SaaS aesthetic |
| Feature-based folder structure | Scales well for enterprise apps |
| CSS custom properties over Tailwind config | More flexible, works with glassmorphism |

---

## [0.2.0] — 2026-07-07 — Phase 2: Authentication Complete ✅

### Summary
Built the secure authentication system for CollabFlow. Configured local MySQL, set up Prisma 7 driver adapter using `@prisma/adapter-mariadb`, applied relational migrations, created jose JWT helpers, validated inputs with Zod, set up route guards in `proxy.ts`, structured Zustand/TanStack client auth store, and built premium dark-first Login, Registration, and Forgot Password UI pages.

### 🆕 Added

#### Backend & Database
- Connected local MySQL database running on port 3306 using `mysql` credentials.
- Configured Prisma 7 client to use `@prisma/adapter-mariadb` driver adapter.
- Generated and ran initial migration `20260707105042_init` creating all 24 database tables.
- `src/lib/auth.ts` — JWT utility functions using `jose` (`signAccessToken`, `verifyAccessToken`, `signRefreshToken`, `verifyRefreshToken`).
- `src/lib/validations.ts` — Zod validation schemas (`LoginSchema`, `RegisterSchema`) and TypeScript definitions.
- `POST /api/auth/register` — Create user, hash password with `bcryptjs`, store refresh token in database, issue cookie + access token.
- `POST /api/auth/login` — Authenticate credentials, issue refresh token (secure cookie) and access token.
- `POST /api/auth/logout` — Invalidate refresh token in database and delete cookies.
- `POST /api/auth/refresh` — Token rotation endpoint for secure sliding sessions.
- `GET /api/auth/me` — Authenticated user profile lookup route.

#### Security & Routing
- `src/proxy.ts` — Implemented request header injection for user identity (`x-user-id`, `x-user-email`, `x-user-name`) and protected/unprotected route redirections.

#### Frontend & UI
- Integrated `Providers.tsx` wrapping the application layout with TanStack `QueryClient` and session restoration checks on initial mount.
- Initialized Shadcn UI framework using default Tailwind v4 configurations.
- `src/store/auth.store.ts` — Zustand store managing client-side `user`, `accessToken`, and `isInitialized` status.
- `src/services/auth.service.ts` — API client helper with automatic silent 401 token refresh interception.
- `src/hooks/useAuth.ts` — React hook interface for auth mutations.
- `LoginForm.tsx` & `RegisterForm.tsx` — Styled react-hook-form inputs with loading animations and inline Zod validation errors.
- `/login` page — Fully interactive forms in centered glassmorphism card.
- `/register` page — Registration form with password confirmation.
- `/forgot-password` page — Form offering simulated password resets.
- `/dashboard` page — Dynamic welcome layout displaying database connectivity status.
- `DashboardLayout` — Styled sidebar with initials avatar fallback, navigation items, and a functional Sign Out action.

### 🔧 Fixed
- Fixed typescript compilation error in `prisma.config.ts` by using direct connection string input for `PrismaMariaDb` adapter.
- Fixed typo styling keys in `dashboard/page.tsx` and `forgot-password/page.tsx`.
- Removed `next/font/google` Geist font loader from `layout.tsx` to prevent build failures caused by offline sandbox environment constraints.
- Resolved Zod safeParse schema error typing by using `.issues` instead of `.errors`.

---

## [0.3.0] — 2026-07-07 — Phase 3: Workspace Module Complete ✅

### Summary
Built the comprehensive Workspaces Module. Implemented workspace CRUD operations, tokenized membership invite flow, members role promotion/demotion and removal, Zustand workspace selection stores, and fully responsive glassmorphic settings panels.

### 🆕 Added
- `POST /api/workspaces` — Validate data, initialize workspace, and assign owner in a single database transaction.
- `GET /api/workspaces` — Query all workspaces user holds membership in.
- `GET /api/workspaces/[id]` — Fetch specific workspace details, project lists, and invites.
- `PATCH /api/workspaces/[id]` — Update general workspace properties (restricted to owner/admin).
- `DELETE /api/workspaces/[id]` — Permanently cascade delete a workspace (restricted to owner).
- `POST /api/workspaces/[id]/invite` — Generate secure tokenized email invitations.
- `GET /api/workspaces/invite/[token]` — Verify validity, expiration, and metadata of join token.
- `POST /api/workspaces/invite/[token]` — Accept invitation, match email compatibility, and join workspace.
- `PATCH /api/workspaces/[id]/members/[memberId]` — Update member roles (admin, member, viewer).
- `DELETE /api/workspaces/[id]/members/[memberId]` — Revoke workspace membership.
- `workspace.service.ts` — API query and mutation wrappers.
- `workspace.store.ts` — Zustand store for state management.
- `WorkspaceModal.tsx` — Workspace creation modal featuring automated slug conversion.
- `WorkspaceSwitcher.tsx` — Sidebar switcher dropdown.
- `/workspace/[id]` — Main active workspace portal.
- `/workspace/[id]/settings` — Tabbed settings dashboard (General, Members, Invites).
- `/invite/[token]` — Public acceptance invitation panel.

---

## [0.4.0] — 2026-07-07 — Phase 4: Projects & Boards Complete ✅

### Summary
Built the comprehensive Projects & Boards module. Integrated project CRUD operations, board column creation/renaming/deletion, horizontal board layouts, project settings dashboards, and project selection stores.

### 🆕 Added
- `POST /api/workspaces/[id]/projects` — Validates project name/key, creates project, sets lead, and initializes default board & columns in a single transaction.
- `GET /api/workspaces/[id]/projects` — Lists projects inside workspace.
- `GET /api/projects/[id]` — Returns details, members, and boards.
- `PATCH /api/projects/[id]` — Updates details (lead/admin restricted).
- `DELETE /api/projects/[id]` — Permanently cascade deletes project (lead/owner restricted).
- `POST /api/projects/[id]/boards` — Generates Kanban boards with default column sets.
- `POST /api/boards/[id]/columns` — Adds columns to board, auto-positioning indices.
- `PATCH /api/boards/[id]/columns/[columnId]` — Renames column/updates color label.
- `DELETE /api/boards/[id]/columns/[columnId]` — Deletes column.
- `project.service.ts` — API query and mutation wrappers.
- `project.store.ts` — Zustand store for state management.
- `ProjectModal.tsx` — Project creation form popup modal.
- `BoardColumnComponent.tsx` — Column visual component with inline renaming.
- `/workspace/[id]/project/[projectId]` — Main active project board portal.
- `/workspace/[id]/project/[projectId]/settings` — Project details modification page.
- Updated `/workspace/[id]` to show project listings and link creation modal.

---

## [0.6.0] — 2026-07-07 — Phase 6: Real-time Collaboration ✅

### Summary
Successfully integrated real-time synchronization using **Socket.io** with a custom HTTP server. Project boards now synchronize task creations, edits, moves, deletions, and comments instantly. Additionally, we added active member presence indicators and live comment typing indicators.

### 🆕 Added

#### Custom HTTP + WebSockets Server (`server.ts`)
- Created custom root-level `server.ts` which boots Next.js and attaches a generic-typed Socket.io Server instance sharing the same port (3000).
- Handshake middleware verifies incoming user JWTs with `jose` using `JWT_SECRET`, extracting secure user data (`userId`, `userName`) onto connection sockets.
- Implements room join/leave listeners for project boards (`project:{projectId}`), workspaces (`workspace:{workspaceId}`), and individual users (`user:{userId}`).
- Broadcasts room-specific user presence updates (`presence:update`, `user:online`, `user:offline`).

#### API Routes Integration
- Setup `/src/lib/io.ts` as a global container for the Socket.io server instance, preventing circular dependency issues.
- Updated `POST /api/projects/[id]/tasks` to broadcast `task:created` to the project room.
- Updated `PATCH /api/tasks/[id]` to broadcast `task:updated`.
- Updated `PATCH /api/tasks/[id]/move` to broadcast `task:moved`.
- Updated `DELETE /api/tasks/[id]` to broadcast `task:deleted`.
- Updated `POST /api/tasks/[id]/comments` to broadcast `comment:created`.

#### Client Hooks & Infrastructure
- Created `src/lib/socket.ts` lazy socket client singleton. It handles connection credentials, supports auto-reconnection (up to 5 attempts), and handles clean socket disposal on logout.
- Created `src/hooks/useSocket.ts` to manage the WebSocket connection lifecycle when credentials are ready.
- Created `src/hooks/usePresence.ts` to maintain a reactive `Set` of currently online project board members.
- Created `src/hooks/useProjectSocket.ts` to listen for board events and update the Zustand stores and query cache (invalidates queries immediately).
- Integrated `SocketConnectionInitializer` inside `Providers.tsx` to handle connection states globally.

#### Real-time UI Controls
- **Presence Avatars:** Renders live member avatars with green indicator dots in the board header of `project/[projectId]/page.tsx` showing who else is currently viewing the board.
- **Connection Indicator:** Shows a clean green `"Live"` / grey `"Offline"` indicator with icons mapping the socket connectivity status.
- **Typing Indicators:** Broadcasts typing statuses from the `TaskDrawer` comments textarea, showing `"[User] is typing..."` below comments lists with custom dot blinking animations.

### 📦 Dependencies Added
- `socket.io` (v4.8.1)
- `socket.io-client` (v4.8.1)
- `tsx` (v4.19.2) - used for running server.ts directly in development and production

---

## [0.5.0] — 2026-07-07 — Phase 5: Task Management ✅

### Summary
Built the comprehensive Task Management module. Implemented full task CRUD REST APIs with auto-calculated identifiers and fractional position indexing, drag-and-drop Kanban reordering via `@dnd-kit`, a rich Task Details side drawer with auto-saving fields, inline task creation, and a threaded comment system.

### 🆕 Added

#### REST API Routes
- `POST /api/projects/[id]/tasks` — Creates task inside board column. Auto-calculates `identifier` (e.g. `BILL-1` from project key + task count), auto-calculates fractional `position` (max column position + 65536). Supports assignees via `TaskAssignee` transaction.
- `GET /api/projects/[id]/tasks` — Lists all project tasks ordered by column + position. Includes assignees, creator, label, and `_count` totals.
- `PATCH /api/tasks/[id]` — Edits task title, description, priority, estimate, due date, status. Performs assignee diff (delete all + re-insert) when `assigneeIds` is provided.
- `PATCH /api/tasks/[id]/move` — Moves task to new column with pre-computed fractional position. Updates `status` to column name and sets `completedAt` when moved to terminal column.
- `DELETE /api/tasks/[id]` — Deletes task (restricted to creator, project lead, or workspace admin).
- `GET /api/tasks/[id]/comments` — Returns top-level comment tree with nested replies (2 levels).
- `POST /api/tasks/[id]/comments` — Creates comment with optional `parentId` for threaded replies.

#### Validation Schemas (`src/lib/validations.ts`)
- `CreateTaskSchema` — title, columnId, boardId, priority, assigneeIds, dueDate, estimate, parentId
- `UpdateTaskSchema` — all fields optional for partial updates
- `MoveTaskSchema` — columnId + pre-computed position decimal
- `CreateCommentSchema` — content + optional parentId

#### Client Service (`src/services/task.service.ts`)
- `createTask`, `listTasks`, `updateTask`, `moveTask`, `deleteTask` — all task API wrappers
- `listComments`, `createComment` — comment API wrappers
- Uses existing `apiFetch` utility for auth + silent token refresh

#### Zustand Store (`src/store/task.store.ts`)
- `tasks[]`, `activeTask`, `isDrawerOpen` state
- `setTasks`, `addTask`, `updateTask`, `removeTask` — CRUD actions
- `openDrawer(task)`, `closeDrawer()` — drawer control
- `optimisticMoveTask(taskId, toColumnId, newPosition, newStatus)` — instant UI update before API confirms

#### Components
- `src/components/tasks/TaskCard.tsx` — dnd-kit `useSortable`, left priority color border stripe, identifier badge, title (2-line clamp), stacked assignee initials avatars (max 3 + overflow chip), due date with overdue/today color indicators, comment + attachment counts
- `src/components/tasks/TaskCreateInline.tsx` — Per-column expandable input at column bottom. Enter to submit, Escape to cancel, auto-resize textarea
- `src/components/tasks/TaskDrawer.tsx` — 500px right side panel with:
  - Auto-saving title `<textarea>` (600ms debounce via `setTimeout`)
  - Meta fields grid: Priority select, Status/column select, Due date picker, Estimate hours input
  - Assignee chips list
  - Plain text description `<textarea>` (auto-saving)
  - Save indicator ("Saving..." / "Saved" with icon transitions)
  - Threaded comment list with nested reply indent
  - Reply-to banner with quick dismiss
  - Comment input (Enter to send, Shift+Enter for newline)
  - Delete task with confirmation dialog

#### Board Integration
- `src/components/projects/BoardColumnComponent.tsx` — Refactored with `@dnd-kit/sortable` `SortableContext` + `useDroppable`. Drop zone highlights with accent border when hovered. Live task count badge. `TaskCreateInline` at bottom of each column.
- `src/app/(dashboard)/workspace/[id]/project/[projectId]/page.tsx` — Wrapped with `DndContext` + `PointerSensor` (8px activation distance prevents accidental drags). `DragOverlay` ghost card (2° rotate). `computeNewPosition()` fractional index helper. Optimistic move + API mutation. `TaskDrawer` rendered at page level.

### 📦 Dependencies Added
```
@dnd-kit/core        latest
@dnd-kit/sortable    latest
@dnd-kit/utilities   latest
@tiptap/react        latest  (installed, reserved for Phase 6+)
@tiptap/pm           latest
@tiptap/starter-kit  latest
```

### ⚙️ Technical Decisions Made

| Decision | Rationale |
|----------|-----------|
| `@dnd-kit` over `react-beautiful-dnd` | react-beautiful-dnd is unmaintained; dnd-kit is actively maintained and React 19 compatible |
| Fractional indexing on client | Client computes `(A+B)/2` or `maxPos+65536` and sends final Decimal to API — no server-side neighbor query needed |
| Assignee diff = delete-all + re-insert | Simplest correct approach; avoids complex set-difference logic in Prisma |
| Plain textarea for description | Avoids Tiptap SSR complexity for Phase 5; Tiptap installed and ready for Phase 6 upgrade |
| `optimisticMoveTask` in Zustand | Instant drag feedback; API call confirms or `refetchTasks()` reverts on error |
| Auto-save with `setTimeout` not `debounce()` | Avoids TypeScript generic constraint conflict with existing `debounce` utility |

---

## [0.7.0] — 2026-07-07 — Phase 7: Chat System ✅

### Summary
Built the fully real-time Slack-style Chat System. Workspace members can create public or private channels, converse in real-time, react with emojis, see live typing indicators, and reply in detailed sub-thread panels.

### 🆕 Added
- `POST /api/workspaces/[id]/channels` — Creates public/private channel and joins members
- `GET /api/workspaces/[id]/channels` — Lists workspace channels
- `POST /api/channels/[id]/messages` — Creates message and triggers real-time socket delivery
- `GET /api/channels/[id]/messages` — Retrieves pagination-ready messages timeline
- `POST /api/messages/[id]/reactions` — Toggles emoji reactions on hover
- `chat.service.ts` & `chat.store.ts` — State actions & wrappers
- `useChatSocket.ts` — Real-time event subscriptions
- `ChannelModal.tsx` & `/chat` — UI pages and widgets mapping chat layouts

---

## [0.8.0] — 2026-07-07 — Phase 8: Notifications ✅

### Summary
Implemented a comprehensive real-time Notifications System. Workspace members are notified instantly when they are assigned tasks, when comments are added to their tasks, or when their name is @mentioned in descriptions, comments, or chat rooms. Included deep-linked redirection logic to auto-open task drawers from URLs.

### 🆕 Added
- `GET /api/notifications` — Fetches user's notification list with pagination
- `PATCH /api/notifications/[id]/read` — Marks single notifications read
- `PATCH /api/notifications/read-all` — Marks all notifications for user read
- `notification.helper.ts` — Central creator and mention scanners
- `notification.service.ts` — Client API wrappers
- `NotificationCenter.tsx` — Navbar Bell icon with glowing unread counts and dropdown list
- `?task=taskId` — Auto-open deep-linked task drawer hook inside Board Page

---

## [0.9.0] — 2026-07-07 — Phase 9: Analytics Dashboard ✅

### Summary
Built the comprehensive Workspace Analytics Dashboard. Aggregated KPI statistics, project velocity (daily timeline counts), and active member task workloads. Created visual custom SVG line graphs and CSS priority/workload bars displaying metrics.

### 🆕 Added
- `GET /api/workspaces/[id]/analytics` — Returns workspace-level KPIs, priority splits, workloads, and completions timelines
- `/workspace/[id]/analytics` — Visual dashboard portal
- SVG line chart generator drawing completions trends over 14 days
- CSS workload/priority list progress bars

---

## [1.0.0] — 2026-07-07 — Phase 10: Testing & Production Deployment ✅

### Summary
Established testing frameworks and verified production compatibility. Installed and configured Vitest for fast in-memory unit tests of utils and JWT authentication helper scripts. Configured Playwright browser test runner and created E2E flow testing landing pages and registration user creation paths. Verified database schema status and Next.js bundle compiles cleanly.

### 🆕 Added
- `vitest.config.ts` & `playwright.config.ts` — Testing framework configs
- `/src/lib/utils.test.ts` — Unit tests for initials, slugify, and size helpers
- `/src/lib/auth.test.ts` — Unit tests for Jose access/refresh signatures and validations
- `/tests/auth-flow.spec.ts` — Browser E2E registration and dashboard flows
- `npm run test` & `npm run test:e2e` scripts integration



