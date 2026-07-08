# CollabFlow — Database Design

**Version:** 1.0  
**Date:** 2026-07-07  
**Database:** MySQL 8.0  
**ORM:** Prisma  

---

## 1. Entity Relationship Overview

```
┌──────────┐       ┌──────────────────┐       ┌───────────┐
│  User    │──────►│ WorkspaceMember   │◄──────│ Workspace │
└──────────┘       └──────────────────┘       └─────┬─────┘
     │                                               │
     │              ┌───────────┐                    │
     │              │   Team    │◄───────────────────┤
     │              └─────┬─────┘                    │
     │                    │                          │
     │              ┌─────▼─────┐                    │
     │              │TeamMember │                    │
     │              └───────────┘                    │
     │                                        ┌──────▼──────┐
     │              ┌───────────┐             │   Project   │
     │              │  Channel  │◄────────────┤             │
     │              └─────┬─────┘             └──────┬──────┘
     │                    │                          │
     │              ┌─────▼─────┐             ┌──────▼──────┐
     │              │  Message  │             │    Board    │
     │              └─────┬─────┘             └──────┬──────┘
     │                    │                          │
     │              ┌─────▼─────┐             ┌──────▼──────┐
     │              │Attachment │             │BoardColumn  │
     │              └───────────┘             └──────┬──────┘
     │                                               │
     │              ┌───────────┐             ┌──────▼──────┐
     │◄─────────────│   Task    │◄────────────┤             │
     │  (assignee)  └─────┬─────┘             └─────────────┘
     │                    │
     │         ┌──────────┼──────────┐
     │    ┌────▼───┐  ┌───▼────┐ ┌──▼────────┐
     │    │Comment │  │SubTask │ │Attachment │
     │    └────────┘  └────────┘ └───────────┘
     │
     │    ┌────────────────┐    ┌──────────────┐
     └───►│  Notification  │    │  ActivityLog │
          └────────────────┘    └──────────────┘
```

---

## 2. Table Definitions

### User
```sql
CREATE TABLE users (
  id            VARCHAR(36)  PRIMARY KEY,          -- CUID
  email         VARCHAR(255) UNIQUE NOT NULL,
  name          VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url    VARCHAR(500),
  bio           TEXT,
  timezone      VARCHAR(100) DEFAULT 'UTC',
  theme         ENUM('light','dark','system') DEFAULT 'system',
  is_online     BOOLEAN      DEFAULT FALSE,
  last_seen     DATETIME,
  created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_email (email)
);
```

### Workspace
```sql
CREATE TABLE workspaces (
  id          VARCHAR(36)  PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  slug        VARCHAR(255) UNIQUE NOT NULL,         -- URL-safe identifier
  description TEXT,
  logo_url    VARCHAR(500),
  owner_id    VARCHAR(36)  NOT NULL,
  plan        ENUM('free','pro','enterprise') DEFAULT 'free',
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_slug (slug),
  INDEX idx_owner (owner_id)
);
```

### WorkspaceMember
```sql
CREATE TABLE workspace_members (
  id           VARCHAR(36) PRIMARY KEY,
  workspace_id VARCHAR(36) NOT NULL,
  user_id      VARCHAR(36) NOT NULL,
  role         ENUM('owner','admin','member','viewer') DEFAULT 'member',
  joined_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY uk_workspace_user (workspace_id, user_id),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_workspace (workspace_id),
  INDEX idx_user (user_id)
);
```

### WorkspaceInvite
```sql
CREATE TABLE workspace_invites (
  id           VARCHAR(36)  PRIMARY KEY,
  workspace_id VARCHAR(36)  NOT NULL,
  email        VARCHAR(255) NOT NULL,
  role         ENUM('admin','member','viewer') DEFAULT 'member',
  token        VARCHAR(255) UNIQUE NOT NULL,
  invited_by   VARCHAR(36)  NOT NULL,
  expires_at   DATETIME     NOT NULL,
  accepted_at  DATETIME,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_email (email)
);
```

### Team
```sql
CREATE TABLE teams (
  id           VARCHAR(36)  PRIMARY KEY,
  workspace_id VARCHAR(36)  NOT NULL,
  name         VARCHAR(255) NOT NULL,
  description  TEXT,
  color        VARCHAR(7),                          -- hex color
  created_by   VARCHAR(36)  NOT NULL,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_workspace (workspace_id)
);
```

### TeamMember
```sql
CREATE TABLE team_members (
  id        VARCHAR(36) PRIMARY KEY,
  team_id   VARCHAR(36) NOT NULL,
  user_id   VARCHAR(36) NOT NULL,
  role      ENUM('lead','member') DEFAULT 'member',
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY uk_team_user (team_id, user_id),
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Project
```sql
CREATE TABLE projects (
  id           VARCHAR(36)  PRIMARY KEY,
  workspace_id VARCHAR(36)  NOT NULL,
  team_id      VARCHAR(36),                         -- optional team ownership
  name         VARCHAR(255) NOT NULL,
  description  TEXT,
  identifier   VARCHAR(10)  NOT NULL,               -- e.g., "COL" for task IDs like COL-123
  status       ENUM('planning','active','on_hold','completed','archived') DEFAULT 'planning',
  priority     ENUM('critical','high','medium','low') DEFAULT 'medium',
  lead_id      VARCHAR(36),
  start_date   DATE,
  end_date     DATE,
  logo_url     VARCHAR(500),
  is_public    BOOLEAN DEFAULT FALSE,
  created_by   VARCHAR(36) NOT NULL,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL,
  FOREIGN KEY (lead_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  UNIQUE KEY uk_workspace_identifier (workspace_id, identifier),
  INDEX idx_workspace (workspace_id),
  INDEX idx_status (status)
);
```

### ProjectMember
```sql
CREATE TABLE project_members (
  id         VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36) NOT NULL,
  user_id    VARCHAR(36) NOT NULL,
  role       ENUM('lead','member','viewer') DEFAULT 'member',
  joined_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY uk_project_user (project_id, user_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Board
```sql
CREATE TABLE boards (
  id         VARCHAR(36)  PRIMARY KEY,
  project_id VARCHAR(36)  NOT NULL,
  name       VARCHAR(255) NOT NULL,
  type       ENUM('kanban','list','calendar','timeline') DEFAULT 'kanban',
  created_by VARCHAR(36)  NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_project (project_id)
);
```

### BoardColumn
```sql
CREATE TABLE board_columns (
  id          VARCHAR(36)  PRIMARY KEY,
  board_id    VARCHAR(36)  NOT NULL,
  name        VARCHAR(255) NOT NULL,
  color       VARCHAR(7),
  position    INT          NOT NULL DEFAULT 0,
  is_terminal BOOLEAN      DEFAULT FALSE,           -- "Done" columns
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
  INDEX idx_board (board_id),
  INDEX idx_position (position)
);
```

### Task
```sql
CREATE TABLE tasks (
  id           VARCHAR(36)  PRIMARY KEY,
  project_id   VARCHAR(36)  NOT NULL,
  board_id     VARCHAR(36),
  column_id    VARCHAR(36),
  parent_id    VARCHAR(36),                         -- for sub-tasks
  title        VARCHAR(500) NOT NULL,
  description  LONGTEXT,                            -- rich text (HTML/JSON)
  identifier   VARCHAR(20)  NOT NULL,               -- e.g., "COL-42"
  status       VARCHAR(50)  DEFAULT 'todo',
  priority     ENUM('critical','high','medium','low','none') DEFAULT 'medium',
  position     DECIMAL(20,8) NOT NULL DEFAULT 0,   -- fractional indexing
  due_date     DATETIME,
  start_date   DATETIME,
  estimate     DECIMAL(6,2),                        -- hours
  created_by   VARCHAR(36)  NOT NULL,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME ON UPDATE CURRENT_TIMESTAMP,
  completed_at DATETIME,
  
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE SET NULL,
  FOREIGN KEY (column_id) REFERENCES board_columns(id) ON DELETE SET NULL,
  FOREIGN KEY (parent_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_project (project_id),
  INDEX idx_column (column_id),
  INDEX idx_priority (priority),
  INDEX idx_due_date (due_date),
  INDEX idx_position (position),
  INDEX idx_identifier (identifier)
);
```

### TaskAssignee
```sql
CREATE TABLE task_assignees (
  task_id    VARCHAR(36) NOT NULL,
  user_id    VARCHAR(36) NOT NULL,
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  assigned_by VARCHAR(36),
  
  PRIMARY KEY (task_id, user_id),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Label
```sql
CREATE TABLE labels (
  id           VARCHAR(36)  PRIMARY KEY,
  workspace_id VARCHAR(36)  NOT NULL,
  name         VARCHAR(100) NOT NULL,
  color        VARCHAR(7)   NOT NULL,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  UNIQUE KEY uk_workspace_name (workspace_id, name)
);
```

### TaskLabel
```sql
CREATE TABLE task_labels (
  task_id  VARCHAR(36) NOT NULL,
  label_id VARCHAR(36) NOT NULL,
  
  PRIMARY KEY (task_id, label_id),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
);
```

### Comment
```sql
CREATE TABLE comments (
  id         VARCHAR(36) PRIMARY KEY,
  task_id    VARCHAR(36) NOT NULL,
  author_id  VARCHAR(36) NOT NULL,
  parent_id  VARCHAR(36),                           -- threaded replies
  content    TEXT        NOT NULL,
  is_edited  BOOLEAN     DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
  INDEX idx_task (task_id)
);
```

### Channel
```sql
CREATE TABLE channels (
  id           VARCHAR(36)  PRIMARY KEY,
  workspace_id VARCHAR(36)  NOT NULL,
  project_id   VARCHAR(36),                         -- optional project binding
  name         VARCHAR(100) NOT NULL,
  description  TEXT,
  type         ENUM('public','private','dm') DEFAULT 'public',
  created_by   VARCHAR(36)  NOT NULL,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  UNIQUE KEY uk_workspace_name (workspace_id, name),
  INDEX idx_workspace (workspace_id)
);
```

### ChannelMember
```sql
CREATE TABLE channel_members (
  channel_id VARCHAR(36) NOT NULL,
  user_id    VARCHAR(36) NOT NULL,
  joined_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (channel_id, user_id),
  FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Message
```sql
CREATE TABLE messages (
  id         VARCHAR(36) PRIMARY KEY,
  channel_id VARCHAR(36) NOT NULL,
  author_id  VARCHAR(36) NOT NULL,
  parent_id  VARCHAR(36),                           -- thread reply
  content    TEXT,
  is_edited  BOOLEAN     DEFAULT FALSE,
  is_pinned  BOOLEAN     DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES messages(id) ON DELETE CASCADE,
  INDEX idx_channel (channel_id),
  INDEX idx_created (created_at)
);
```

### Reaction
```sql
CREATE TABLE reactions (
  id         VARCHAR(36)  PRIMARY KEY,
  message_id VARCHAR(36)  NOT NULL,
  user_id    VARCHAR(36)  NOT NULL,
  emoji      VARCHAR(10)  NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY uk_msg_user_emoji (message_id, user_id, emoji),
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Attachment
```sql
CREATE TABLE attachments (
  id          VARCHAR(36)  PRIMARY KEY,
  task_id     VARCHAR(36),
  message_id  VARCHAR(36),
  uploader_id VARCHAR(36)  NOT NULL,
  filename    VARCHAR(255) NOT NULL,
  file_url    VARCHAR(500) NOT NULL,
  file_size   BIGINT       NOT NULL,               -- bytes
  mime_type   VARCHAR(100) NOT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
  FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Document
```sql
CREATE TABLE documents (
  id           VARCHAR(36)  PRIMARY KEY,
  workspace_id VARCHAR(36)  NOT NULL,
  project_id   VARCHAR(36),
  title        VARCHAR(255) NOT NULL DEFAULT 'Untitled',
  content      LONGTEXT,                            -- JSON (TipTap/ProseMirror)
  created_by   VARCHAR(36)  NOT NULL,
  last_edited_by VARCHAR(36),
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_workspace (workspace_id),
  INDEX idx_project (project_id)
);
```

### Notification
```sql
CREATE TABLE notifications (
  id          VARCHAR(36)  PRIMARY KEY,
  user_id     VARCHAR(36)  NOT NULL,
  type        VARCHAR(50)  NOT NULL,               -- task_assigned, mentioned, etc.
  title       VARCHAR(255) NOT NULL,
  body        TEXT,
  action_url  VARCHAR(500),
  actor_id    VARCHAR(36),
  entity_type VARCHAR(50),                          -- task, message, comment
  entity_id   VARCHAR(36),
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_read (is_read),
  INDEX idx_created (created_at)
);
```

### ActivityLog
```sql
CREATE TABLE activity_logs (
  id           VARCHAR(36)  PRIMARY KEY,
  workspace_id VARCHAR(36)  NOT NULL,
  project_id   VARCHAR(36),
  actor_id     VARCHAR(36)  NOT NULL,
  action       VARCHAR(100) NOT NULL,              -- created, updated, deleted, etc.
  entity_type  VARCHAR(50)  NOT NULL,              -- task, project, comment, etc.
  entity_id    VARCHAR(36)  NOT NULL,
  entity_name  VARCHAR(255),
  metadata     JSON,                               -- extra data about the action
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_workspace (workspace_id),
  INDEX idx_project (project_id),
  INDEX idx_actor (actor_id),
  INDEX idx_created (created_at)
);
```

---

## 3. Relationships Summary

| Relationship | Type | Description |
|-------------|------|-------------|
| User ↔ Workspace | Many-to-Many | Via WorkspaceMember |
| User ↔ Team | Many-to-Many | Via TeamMember |
| User ↔ Project | Many-to-Many | Via ProjectMember |
| Workspace → Project | One-to-Many | Workspace has many Projects |
| Project → Board | One-to-Many | Project has many Boards |
| Board → BoardColumn | One-to-Many | Board has many Columns |
| BoardColumn → Task | One-to-Many | Column has many Tasks |
| Task → Task | Self-referential | Sub-tasks via parent_id |
| Task ↔ User | Many-to-Many | Via TaskAssignee |
| Task ↔ Label | Many-to-Many | Via TaskLabel |
| Task → Comment | One-to-Many | Task has many Comments |
| Comment → Comment | Self-referential | Thread replies via parent_id |
| Workspace → Channel | One-to-Many | Workspace has many Channels |
| Channel → Message | One-to-Many | Channel has many Messages |
| Message → Message | Self-referential | Thread replies |
| Message ↔ Reaction | One-to-Many | Message has many Reactions |
| User → Notification | One-to-Many | User has many Notifications |
| Workspace → ActivityLog | One-to-Many | Audit trail |

---

## 4. Normalization Notes

- All tables are in **3NF (Third Normal Form)**
- No transitive dependencies
- Proper separation of many-to-many via junction tables
- JSON column used only for `metadata` in ActivityLog (schema-flexible audit data)
- Fractional indexing (`position DECIMAL(20,8)`) used for drag-and-drop ordering without reordering entire table
- CUIDs used as primary keys (random, non-guessable, URL-safe)

---

## 5. Indexes Strategy

| Table | Index | Purpose |
|-------|-------|---------|
| users | email | Login lookup |
| workspaces | slug | URL-based lookup |
| tasks | project_id, column_id | Filter tasks per board |
| tasks | priority, due_date | Sorted task views |
| tasks | position | Ordered display |
| messages | channel_id, created_at | Chat history pagination |
| notifications | user_id, is_read | Notification center queries |
| activity_logs | workspace_id, created_at | Feed queries |
