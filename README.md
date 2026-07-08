# 🚀 CollabFlow

> **"Collaborate. Build. Deliver."**

A production-ready, real-time collaborative workspace SaaS platform for modern teams. CollabFlow is built to compete with Notion, Slack, Linear, Jira, and ClickUp — combining project management, real-time chat, collaborative documents, and analytics into one unified, beautifully designed platform.

---

## 📸 What is CollabFlow?

CollabFlow is a full-stack SaaS application where teams can:

- Create shared **Workspaces** and invite team members with role-based access
- Manage **Projects**, **Boards**, and **Tasks** (Kanban, List, Calendar, Timeline views)
- Collaborate in **Real-time** with live presence, cursors, and task updates
- Chat via **Channels** and **Direct Messages** (Slack-style)
- Write **Collaborative Documents** (Notion-style rich text)
- Track work via **Activity Timelines** and **Analytics Dashboards**
- Receive **Real-time Notifications** with @mentions
- Upload and manage **Files** and attachments

---

## 🏗️ Build Status

| Phase | Module | Status | Progress |
|-------|--------|--------|----------|
| **Phase 1** | Planning, Architecture, Database, Design System | ✅ **Complete** | 100% |
| **Phase 2** | Authentication (JWT, Prisma, MySQL, UI) | ✅ **Complete** | 100% |
| **Phase 3** | Workspace Module | ✅ **Complete** | 100% |
| **Phase 4** | Projects & Boards | ✅ **Complete** | 100% |
| **Phase 5** | Task Management | ✅ **Complete** | 100% |
| **Phase 6** | Real-time Collaboration (Socket.io) | ✅ **Complete** | 100% |
| **Phase 7** | Real-time Chat (Slack-style Channels & DMs) | ✅ **Complete** | 100% |
| **Phase 8** | Real-time Notifications with @mentions | ✅ **Complete** | 100% |
| **Phase 9** | Workspace Analytics Dashboard (SVG Graphs) | ✅ **Complete** | 100% |
| **Phase 10** | Automated Testing & Production Deployment | ✅ **Complete** | 100% |

**Overall Progress: 100%**

---

## ⚙️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 16.2.10 | React Framework (App Router) |
| React | 19.2.4 | UI Library |
| TypeScript | 5+ | Type Safety |
| Tailwind CSS | 4 | Utility-first CSS |
| Shadcn UI | Latest | Component Library |
| Framer Motion | 12+ | Animations |
| TanStack Query | 5+ | Server State Management |
| React Hook Form | 7+ | Form Management |
| Zod | 4+ | Schema Validation |
| Zustand | 5+ | Global Client State |
| Lucide React | 1+ | Icon Library |
| **@dnd-kit** | **Latest** | **Drag-and-drop (Phase 5)** |
| **Socket.io-client** | **Latest** | **WebSocket connection (Phase 6)** |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js API Routes | 16 | REST API Endpoints |
| Prisma ORM | 7.8.0 | Database Access Layer |
| bcryptjs | 3+ | Password Hashing |
| jose | 6+ | JWT Auth (sign/verify) |
| Socket.io | ^4.8.1 | Real-time WebSockets (Phase 6) |
| Zod | 4+ | Input Validation |

### Database
| Technology | Purpose |
|-----------|---------|
| MySQL 8.0 | Primary Relational Database |
| Prisma Migrate | Schema Migrations |
| Railway | Production MySQL Hosting |

### Infrastructure
| Service | Purpose |
|---------|---------|
| Vercel | Next.js Deployment |
| Railway | MySQL Database |
| GitHub | Version Control + CI/CD |
| Uploadthing | File Storage (Phase 5+) |

---

## 📁 Project Structure

```
collabflow/
├── src/
│   ├── app/                            # Next.js App Router
│   │   ├── (auth)/                     # Auth route group (no sidebar)
│   │   │   ├── layout.tsx              ✅ Created
│   │   │   ├── login/page.tsx          ✅ Stub (full form: Phase 2)
│   │   │   └── register/page.tsx       ✅ Stub (full form: Phase 2)
│   │   ├── (dashboard)/                # Protected route group
│   │   │   ├── layout.tsx              ✅ Stub (full layout: Phase 2)
│   │   │   └── workspace/[id]/         ⏳ Phase 3
│   │   ├── api/                        ⏳ Phase 2+
│   │   │   ├── auth/                   ⏳ Phase 2
│   │   │   ├── workspaces/             ⏳ Phase 3
│   │   │   ├── projects/               ⏳ Phase 4
│   │   │   ├── tasks/                  ⏳ Phase 5
│   │   │   ├── messages/               ⏳ Phase 7
│   │   │   └── notifications/          ⏳ Phase 8
│   │   ├── globals.css                 ✅ Design system (400+ lines)
│   │   ├── layout.tsx                  ✅ Root layout with metadata
│   │   └── page.tsx                    ✅ Landing page
│   │
│   ├── lib/
│   │   ├── prisma.ts                   ✅ Prisma singleton
│   │   ├── utils.ts                    ✅ Utility functions (15+)
│   │   ├── auth.ts                     ⏳ Phase 2 (JWT utilities)
│   │   ├── validations.ts              ⏳ Phase 2 (Zod schemas)
│   │   └── socket.ts                   ⏳ Phase 6
│   │
│   ├── types/
│   │   ├── auth.types.ts               ✅ Auth + API types
│   │   ├── workspace.types.ts          ✅ Workspace + Team types
│   │   ├── project.types.ts            ✅ Project + Board + Task types
│   │   └── socket.types.ts             ✅ Chat + Socket event types
│   │
│   ├── components/                     ⏳ Phase 2+
│   ├── hooks/                          ⏳ Phase 2+
│   ├── services/                       ⏳ Phase 2+
│   ├── store/                          ⏳ Phase 2+
│   └── proxy.ts                        ✅ Route guard (placeholder)
│
├── prisma/
│   └── schema.prisma                   ✅ 24 models, client generated
│
├── docs/
│   ├── DATABASE.md                     ✅ ER design + all table defs
│   └── API.md                          ⏳ Phase 2
│
├── prisma.config.ts                    ✅ Prisma 7 configuration
├── next.config.ts                      ✅ Next.js 16 config
├── .env.example                        ✅ Env var template
├── README.md                           ✅ This file
├── PRD.md                              ✅ Product Requirements
├── ARCHITECTURE.md                     ✅ System Architecture
├── ROADMAP.md                          ✅ Development Roadmap
├── PROJECT_STATE.md                    ✅ Phase tracking
├── CONTINUE_WITH_AI.md                 ✅ AI continuation context
└── CHANGELOG.md                        ✅ Version history
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8.0 (local or Railway)
- npm

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/collabflow.git
cd collabflow
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
# Edit .env.local — set DATABASE_URL, JWT_SECRET, etc.
```

### 3. Database Setup
```bash
# Install MySQL adapter (needed for Prisma 7)
npm install @prisma/adapter-mysql mysql2

# Generate Prisma client
npx prisma generate

# Run migrations (creates all 24 tables)
npx prisma migrate dev --name init
```

### 4. Run Development Server
```bash
npm run dev
# → http://localhost:3000
```

---

## 🗄️ Database Schema

CollabFlow uses **MySQL 8.0** with **Prisma ORM 7**.

**24 tables** covering the complete domain:

| Group | Tables |
|-------|--------|
| Auth | `users`, `refresh_tokens` |
| Workspace | `workspaces`, `workspace_members`, `workspace_invites` |
| Team | `teams`, `team_members` |
| Project | `projects`, `project_members` |
| Board | `boards`, `board_columns` |
| Task | `tasks`, `task_assignees`, `labels`, `task_labels` |
| Comment | `comments` |
| Chat | `channels`, `channel_members`, `messages`, `reactions` |
| Files | `attachments` |
| Docs | `documents` |
| System | `notifications`, `activity_logs` |

Full schema → [`prisma/schema.prisma`](./prisma/schema.prisma)
ER Design → [`docs/DATABASE.md`](./docs/DATABASE.md)

---

## 🌐 Environment Variables

Copy the `.env.example` file to `.env.local` and define the required variables. **Do not commit actual credentials or secrets to public repositories.**

```env
# Database Configuration
DATABASE_URL=

# JWT Authentication Secrets
JWT_SECRET=
JWT_EXPIRES_IN=
JWT_REFRESH_SECRET=
JWT_REFRESH_EXPIRES_IN=

# Application URLs
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_SOCKET_URL=

# Node Environment
NODE_ENV=

# File Storage Configuration (Uploadthing)
UPLOADTHING_SECRET=
UPLOADTHING_APP_ID=
```

---

## 🚀 Deployment Guide

### 1. Database Deployment (Railway)
1. Provision a **MySQL Database** on Railway.
2. Under database settings, copy the **Connection URL** (e.g., `mysql://...`).
3. Set the `DATABASE_URL` environment variable to this URL.

### 2. Frontend Deployment (Vercel)
1. Connect your GitHub repository to Vercel.
2. In the project settings, add the environment variables defined above:
   * Set `NODE_ENV` to `production`.
   * Generate secure 32-character strings for `JWT_SECRET` and `JWT_REFRESH_SECRET` (e.g., using `openssl rand -base64 32`).
   * Set `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_SOCKET_URL` to your production deployment URL.
3. Configure the Vercel build settings to run `npx prisma generate` during the build step.
4. Click **Deploy**.

---

## 🔒 Security Notes
* **Secrets Management:** All API keys, tokens, and database passwords must live strictly in environment variables. Local credentials must remain in `.env.local` which is permanently ignored by Git.
* **JWT Expirations:** Ensure accessToken lifetimes are kept short (e.g., `15m`) and refresh tokens are securely checked in the database during session restorations.
* **XSS & Clickjacking:** CollabFlow configures custom HTTP security headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`) inside `next.config.ts` to protect the browser runtime.

---

## 📖 Documentation

| Document | Purpose | Status |
|----------|---------|--------|
| [README.md](./README.md) | Project overview & setup | ✅ |
| [PRD.md](./PRD.md) | Product Requirements Document | ✅ |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture & diagrams | ✅ |
| [ROADMAP.md](./ROADMAP.md) | Feature roadmap with phases | ✅ |
| [docs/DATABASE.md](./docs/DATABASE.md) | Database ER design | ✅ |
| [PROJECT_STATE.md](./PROJECT_STATE.md) | Current build state | ✅ |
| [CONTINUE_WITH_AI.md](./CONTINUE_WITH_AI.md) | AI session continuation | ✅ |
| [CHANGELOG.md](./CHANGELOG.md) | Version history | ✅ |

---

## ⚠️ Important Technical Notes

| Item | Detail |
|------|--------|
| **Next.js version** | Auto-upgraded to 16.2.10 during npm install |
| **Prisma version** | 7.8.0 — uses `prisma.config.ts` for DATABASE_URL (not `schema.prisma`) |
| **Middleware** | Renamed to `src/proxy.ts` for Next.js 16 compatibility |
| **Google Fonts** | Loaded via HTML `<link>` tags in `layout.tsx` (not CSS @import — Tailwind v4 incompatibility) |
| **DB Migration** | Migrated successfully to MySQL using Prisma 7 and `@prisma/adapter-mariadb` |

---

## 🛣️ Roadmap

- [x] **Phase 1** — Planning, Architecture, Database Design, Design System
- [x] **Phase 2** — Authentication (JWT, Prisma Migrate, Login/Register UI)
- [x] **Phase 3** — Workspace Management (Create, Invite, Roles)
- [x] **Phase 4** — Projects & Boards (Kanban columns, inline rename/delete)
- [x] **Phase 5** — Task Management (Drag-drop, Assignees, Comments, Task Drawer)
- [x] **Phase 6** — Real-time Collaboration (Socket.io, Presence, Live Updates)
- [x] **Phase 7** — Chat System (Channels, DMs, Threads, Reactions)
- [x] **Phase 8** — Notifications (Push, @Mentions, Activity Feed)
- [x] **Phase 9** — Workspace Analytics Dashboard (SVG Graphs)
- [x] **Phase 10** — Testing, Deployment, Documentation

---

## 🤝 Contributing

This project is built as a portfolio-quality SaaS application. Contributions, issues, and feature requests are welcome.

---

## 📄 License

MIT License — see [LICENSE](./LICENSE) for details.

---

*CollabFlow v0.6.0 — Phase 6 Complete | Built with ❤️ as a production-quality SaaS portfolio project*
