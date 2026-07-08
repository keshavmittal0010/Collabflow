/**
 * CollabFlow — Database Seed Script
 * Uses direct mariadb connection (no Prisma adapter) for simplicity.
 * Run with: node prisma/seed.js
 */

const bcrypt = require('bcryptjs')
const mariadb = require('mariadb')
require('dotenv').config({ path: '.env.local' })

const SALT_ROUNDS = 12

// Parse DATABASE_URL: mysql://user:password@host:port/database
function parseDbUrl(url) {
  const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:\/]+):(\d+)\/(.+)/)
  if (!match) throw new Error('Invalid DATABASE_URL: ' + url)
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: parseInt(match[4]),
    database: match[5],
    connectTimeout: 20000,
    connectionLimit: 5
  }
}

function uuid() {
  // Generate UUID v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

async function main() {
  console.log('🌱 CollabFlow Seed Script Starting...')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  const connConfig = parseDbUrl(process.env.DATABASE_URL)
  console.log(`\n📡 Connecting to MySQL: ${connConfig.host}:${connConfig.port}/${connConfig.database} as ${connConfig.user}`)

  let conn
  try {
    conn = await mariadb.createConnection(connConfig)
    console.log('   ✅ Connected\n')

    // ── Clean old seed users ──────────────────────────────────────────────────
    console.log('🗑️  Cleaning previous seed data...')
    const seedEmails = [
      'aarav.mehta@collabflow.dev',
      'priya.sharma@collabflow.dev',
      'aryan.kapoor@collabflow.dev'
    ]
    // Get IDs first
    const existing = await conn.query(
      `SELECT id FROM users WHERE email IN (?, ?, ?)`,
      seedEmails
    )
    if (existing.length > 0) {
      const ids = existing.map(r => r.id)
      
      await conn.query('SET FOREIGN_KEY_CHECKS = 0')

      // Clean downstream tables
      await conn.query('DELETE FROM comments')
      await conn.query('DELETE FROM task_assignees')
      await conn.query('DELETE FROM workspaces WHERE slug IN ("alpha-studio", "beta-labs")')
      await conn.query('DELETE FROM users WHERE email IN ("alex.morgan@collabflow.dev", "james.carter@collabflow.dev")')
      await conn.query('DELETE FROM task_labels')
      await conn.query('DELETE FROM labels')
      await conn.query('DELETE FROM attachments')
      await conn.query('DELETE FROM tasks')
      await conn.query('DELETE FROM activity_logs')
      await conn.query('DELETE FROM notifications')
      await conn.query('DELETE FROM reactions')
      await conn.query('DELETE FROM messages')
      await conn.query('DELETE FROM channels')

      // Clean workspaces owned by these users
      const workspaces = await conn.query(
        `SELECT id FROM workspaces WHERE owner_id IN (${ids.map(() => '?').join(',')})`,
        ids
      )
      if (workspaces.length > 0) {
        const wsIds = workspaces.map(w => w.id)

        // Find projects under these workspaces
        const projects = await conn.query(
          `SELECT id FROM projects WHERE workspace_id IN (${wsIds.map(() => '?').join(',')})`,
          wsIds
        )
        if (projects.length > 0) {
          const projIds = projects.map(p => p.id)

          // Find boards
          const boards = await conn.query(
            `SELECT id FROM boards WHERE project_id IN (${projIds.map(() => '?').join(',')})`,
            projIds
          )
          if (boards.length > 0) {
            const boardIds = boards.map(b => b.id)
            await conn.query(
              `DELETE FROM board_columns WHERE board_id IN (${boardIds.map(() => '?').join(',')})`,
              boardIds
            )
            await conn.query(
              `DELETE FROM boards WHERE id IN (${boardIds.map(() => '?').join(',')})`,
              boardIds
            )
          }

          await conn.query(
            `DELETE FROM project_members WHERE project_id IN (${projIds.map(() => '?').join(',')})`,
            projIds
          )
          await conn.query(
            `DELETE FROM projects WHERE id IN (${projIds.map(() => '?').join(',')})`,
            projIds
          )
        }

        await conn.query(
          `DELETE FROM workspace_members WHERE workspace_id IN (${wsIds.map(() => '?').join(',')})`,
          wsIds
        )
        await conn.query(
          `DELETE FROM workspaces WHERE id IN (${wsIds.map(() => '?').join(',')})`,
          wsIds
        )
      }

      for (const id of ids) {
        await conn.query(`DELETE FROM workspace_members WHERE user_id = ?`, [id])
        await conn.query(`DELETE FROM project_members WHERE user_id = ?`, [id])
        await conn.query(`DELETE FROM refresh_tokens WHERE user_id = ?`, [id])
      }
      await conn.query(`DELETE FROM users WHERE email IN (?, ?, ?)`, seedEmails)

      await conn.query('SET FOREIGN_KEY_CHECKS = 1')
    }
    console.log('   ✅ Old seed data removed\n')

    // ── Hash password ─────────────────────────────────────────────────────────
    console.log('🔐 Hashing passwords...')
    const password = await bcrypt.hash('Demo@1234', SALT_ROUNDS)
    const now = new Date()
    console.log('   ✅ Password hashed\n')

    // ── Create Users ──────────────────────────────────────────────────────────
    console.log('👤 Creating demo users...')
    const alexId = uuid()
    const priyaId = uuid()
    const jamesId = uuid()

    await conn.query(
      `INSERT INTO users (id, email, name, password_hash, bio, timezone, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [alexId, 'aarav.mehta@collabflow.dev', 'Aarav Mehta', password,
       'Product manager and design enthusiast.', 'America/New_York', now, now]
    )
    await conn.query(
      `INSERT INTO users (id, email, name, password_hash, bio, timezone, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [priyaId, 'priya.sharma@collabflow.dev', 'Priya Sharma', password,
       'Full-stack developer. React + Node expert.', 'Asia/Kolkata', now, now]
    )
    await conn.query(
      `INSERT INTO users (id, email, name, password_hash, bio, timezone, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [jamesId, 'aryan.kapoor@collabflow.dev', 'Aryan Kapoor', password,
       'UI/UX designer and creative director.', 'Europe/London', now, now]
    )
    console.log('   ... Aarav Mehta   →  aarav.mehta@collabflow.dev')
    console.log('   ... Priya Sharma  →  priya.sharma@collabflow.dev')
    console.log('   ... Aryan Kapoor  →  aryan.kapoor@collabflow.dev\n')

    // ── Create Workspaces ─────────────────────────────────────────────────────
    console.log('🏢 Creating demo workspaces...')
    const alphaId = uuid()
    const betaId = uuid()

    await conn.query(
      `INSERT INTO workspaces (id, name, slug, description, plan, owner_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [alphaId, 'Alpha Studio', 'alpha-studio', 'Our flagship design and product team workspace.', 'pro', alexId, now, now]
    )
    await conn.query(
      `INSERT INTO workspace_members (id, workspace_id, user_id, role, joined_at)
       VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)`,
      [uuid(), alphaId, alexId, 'owner', now,
       uuid(), alphaId, priyaId, 'admin', now,
       uuid(), alphaId, jamesId, 'member', now]
    )

    await conn.query(
      `INSERT INTO workspaces (id, name, slug, description, plan, owner_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [betaId, 'Beta Labs', 'beta-labs', 'R&D workspace for experimental features and prototyping.', 'free', priyaId, now, now]
    )
    await conn.query(
      `INSERT INTO workspace_members (id, workspace_id, user_id, role, joined_at)
       VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)`,
      [uuid(), betaId, priyaId, 'owner', now,
       uuid(), betaId, alexId, 'member', now]
    )
    console.log('   ... Alpha Studio (owner: Aarav)')
    console.log('   ... Beta Labs (owner: Priya)\n')

    // ── Create Projects ───────────────────────────────────────────────────────
    console.log('📁 Creating demo projects...')

    // Project 1: Website Redesign
    const webProjId = uuid()
    await conn.query(
      `INSERT INTO projects (id, workspace_id, name, identifier, description, status, priority, lead_id, is_public, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [webProjId, alphaId, 'Website Redesign', 'WEB',
       'Complete overhaul of the marketing website.', 'active', 'high',
       jamesId, false, jamesId, now, now]
    )
    await conn.query(
      `INSERT INTO project_members (id, project_id, user_id, role, joined_at)
       VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)`,
      [uuid(), webProjId, jamesId, 'lead', now,
       uuid(), webProjId, alexId, 'member', now,
       uuid(), webProjId, priyaId, 'member', now]
    )
    const webBoardId = uuid()
    await conn.query(
      `INSERT INTO boards (id, project_id, name, type, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [webBoardId, webProjId, 'Kanban', 'kanban', jamesId, now]
    )
    // Define columns for Project 1: Website Redesign
    const webBacklog = uuid()
    const webTodo = uuid()
    const webProgress = uuid()
    const webDone = uuid()
    await conn.query(
      `INSERT INTO board_columns (id, board_id, name, color, position, is_terminal)
       VALUES (?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?)`,
      [webBacklog, webBoardId, 'Backlog', '#6D8196', 0, false,
       webTodo, webBoardId, 'To Do', '#CBCBCB', 1, false,
       webProgress, webBoardId, 'In Progress', '#4A4A4A', 2, false,
       webDone, webBoardId, 'Done', '#6D8196', 3, true]
    )

    // Project 2: Mobile App
    const mobProjId = uuid()
    await conn.query(
      `INSERT INTO projects (id, workspace_id, name, identifier, description, status, priority, lead_id, is_public, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [mobProjId, alphaId, 'Mobile App v2', 'MOB',
       'Next generation mobile experience with real-time collaboration.', 'planning', 'critical',
       priyaId, false, priyaId, now, now]
    )
    await conn.query(
      `INSERT INTO project_members (id, project_id, user_id, role, joined_at)
       VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)`,
      [uuid(), mobProjId, priyaId, 'lead', now,
       uuid(), mobProjId, alexId, 'member', now]
    )
    const mobBoardId = uuid()
    await conn.query(
      `INSERT INTO boards (id, project_id, name, type, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [mobBoardId, mobProjId, 'Kanban', 'kanban', priyaId, now]
    )
    // Define columns for Project 2: Mobile App
    const mobBacklog = uuid()
    const mobTodo = uuid()
    const mobProgress = uuid()
    const mobReview = uuid()
    const mobDone = uuid()
    await conn.query(
      `INSERT INTO board_columns (id, board_id, name, color, position, is_terminal)
       VALUES (?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?)`,
      [mobBacklog, mobBoardId, 'Backlog', '#6D8196', 0, false,
       mobTodo, mobBoardId, 'Todo', '#CBCBCB', 1, false,
       mobProgress, mobBoardId, 'In Progress', '#4A4A4A', 2, false,
       mobReview, mobBoardId, 'Review', '#FFFFE3', 3, false,
       mobDone, mobBoardId, 'Done', '#6D8196', 4, true]
    )

    // Project 3: API Platform
    const apiProjId = uuid()
    await conn.query(
      `INSERT INTO projects (id, workspace_id, name, identifier, description, status, priority, lead_id, is_public, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [apiProjId, betaId, 'API Platform', 'API',
       'Developer-facing API platform with docs and sandbox testing.', 'active', 'medium',
       priyaId, true, priyaId, now, now]
    )
    await conn.query(
      `INSERT INTO project_members (id, project_id, user_id, role, joined_at)
       VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)`,
      [uuid(), apiProjId, priyaId, 'lead', now,
       uuid(), apiProjId, alexId, 'member', now]
    )
    const apiBoardId = uuid()
    await conn.query(
      `INSERT INTO boards (id, project_id, name, type, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [apiBoardId, apiProjId, 'Kanban', 'kanban', priyaId, now]
    )
    // Define columns for Project 3: API Platform
    const apiBacklog = uuid()
    const apiTodo = uuid()
    const apiProgress = uuid()
    const apiDone = uuid()
    await conn.query(
      `INSERT INTO board_columns (id, board_id, name, color, position, is_terminal)
       VALUES (?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?)`,
      [apiBacklog, apiBoardId, 'Backlog', '#6D8196', 0, false,
       apiTodo, apiBoardId, 'Todo', '#CBCBCB', 1, false,
       apiProgress, apiBoardId, 'In Progress', '#4A4A4A', 2, false,
       apiDone, apiBoardId, 'Done', '#6D8196', 3, true]
    )

    console.log('   ... Website Redesign  (Alpha Studio, lead: Aryan)')
    console.log('   ... Mobile App v2     (Alpha Studio, lead: Priya)')
    console.log('   ... API Platform      (Beta Labs, lead: Priya)\n')

    // ── Create Demo Tasks ───────────────────────────────────────────────────────
    console.log('📝 Creating demo tasks...')
    const tWeb1 = uuid()
    const tWeb2 = uuid()
    const tWeb3 = uuid()
    const tWeb4 = uuid()
    await conn.query(
      `INSERT INTO tasks (id, project_id, board_id, column_id, title, description, identifier, status, priority, position, created_by, created_at, updated_at)
       VALUES 
       (?, ?, ?, ?, 'Design landing page wireframes', 'Create low-fidelity wireframes for the new marketing page layout.', 'WEB-1', 'backlog', 'medium', 1.0, ?, ?, ?),
       (?, ?, ?, ?, 'Review copy deck with marketing team', 'Finalize messaging for product features and pricing pages.', 'WEB-2', 'todo', 'high', 2.0, ?, ?, ?),
       (?, ?, ?, ?, 'Develop CSS variables and global color tokens', 'Set up the basic styling architecture and dark/light mode system.', 'WEB-3', 'in_progress', 'critical', 3.0, ?, ?, ?),
       (?, ?, ?, ?, 'Setup local Next.js development environment', 'Initialize codebase with TS, ESLint, Prettier, and Tailwind configuration.', 'WEB-4', 'done', 'low', 4.0, ?, ?, ?)`,
      [tWeb1, webProjId, webBoardId, webBacklog, jamesId, now, now,
       tWeb2, webProjId, webBoardId, webTodo, alexId, now, now,
       tWeb3, webProjId, webBoardId, webProgress, jamesId, now, now,
       tWeb4, webProjId, webBoardId, webDone, priyaId, now, now]
    )

    const tMob1 = uuid()
    const tMob2 = uuid()
    const tMob3 = uuid()
    await conn.query(
      `INSERT INTO tasks (id, project_id, board_id, column_id, title, description, identifier, status, priority, position, created_by, created_at, updated_at)
       VALUES 
       (?, ?, ?, ?, 'Configure React Native boilerplate', 'Establish initial Android and iOS project shells.', 'MOB-1', 'backlog', 'high', 1.0, ?, ?, ?),
       (?, ?, ?, ?, 'Integrate OAuth 2.0 flow', 'Wire up client logins using keycloak credentials.', 'MOB-2', 'todo', 'critical', 2.0, ?, ?, ?),
       (?, ?, ?, ?, 'Implement push notification handlers', 'Integrate APNS and FCM listeners.', 'MOB-3', 'in_progress', 'medium', 3.0, ?, ?, ?)`,
      [tMob1, mobProjId, mobBoardId, mobBacklog, priyaId, now, now,
       tMob2, mobProjId, mobBoardId, mobTodo, alexId, now, now,
       tMob3, mobProjId, mobBoardId, mobProgress, priyaId, now, now]
    )

    const tApi1 = uuid()
    const tApi2 = uuid()
    await conn.query(
      `INSERT INTO tasks (id, project_id, board_id, column_id, title, description, identifier, status, priority, position, created_by, created_at, updated_at)
       VALUES 
       (?, ?, ?, ?, 'Draft REST endpoint documentation', 'Detail GET, POST, and PATCH specs.', 'API-1', 'backlog', 'low', 1.0, ?, ?, ?),
       (?, ?, ?, ?, 'Optimize MariaDB table indexes', 'Review sluggish query executions.', 'API-2', 'in_progress', 'high', 2.0, ?, ?, ?)`,
      [tApi1, apiProjId, apiBoardId, apiBacklog, priyaId, now, now,
       tApi2, apiProjId, apiBoardId, apiProgress, priyaId, now, now]
    )

    // Task Assignees
    await conn.query(
      `INSERT INTO task_assignees (task_id, user_id, assigned_at)
       VALUES (?, ?, ?), (?, ?, ?), (?, ?, ?), (?, ?, ?)`,
      [tWeb3, priyaId, now,
       tWeb3, jamesId, now,
       tWeb2, alexId, now,
       tMob3, priyaId, now]
    )

    // Comments
    await conn.query(
      `INSERT INTO comments (id, task_id, author_id, content, created_at, updated_at)
       VALUES (?, ?, ?, 'The typography and spacing tokens are complete. Please check the design-tokens file.', ?, ?)`,
      [uuid(), tWeb3, jamesId, now, now]
    )

    // ── Create Demo Activity Logs ───────────────────────────────────────────────
    console.log('⚡ Creating demo activity logs...')
    await conn.query(
      `INSERT INTO activity_logs (id, workspace_id, project_id, actor_id, action, entity_type, entity_id, entity_name, created_at)
       VALUES 
       (?, ?, ?, ?, 'create', 'task', ?, 'Design landing page wireframes', ?),
       (?, ?, ?, ?, 'update', 'task', ?, 'Develop CSS variables and global color tokens', ?),
       (?, ?, ?, ?, 'create', 'project', ?, 'Website Redesign', ?),
       (?, ?, ?, ?, 'create', 'task', ?, 'Implement push notification handlers', ?)`,
      [uuid(), alphaId, webProjId, jamesId, tWeb1, now,
       uuid(), alphaId, webProjId, jamesId, tWeb3, now,
       uuid(), alphaId, webProjId, alexId, webProjId, now,
       uuid(), alphaId, mobProjId, priyaId, tMob3, now]
    )


    // ── Summary ───────────────────────────────────────────────────────────────
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🎉 Seed complete! Test accounts:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('')
    console.log('  Email:    aarav.mehta@collabflow.dev    Password: Demo@1234')
    console.log('  Email:    priya.sharma@collabflow.dev   Password: Demo@1234')
    console.log('  Email:    aryan.kapoor@collabflow.dev   Password: Demo@1234')
    console.log('')
    console.log('  Open → http://localhost:3000/login')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  } catch (err) {
    console.error('\n❌ Seed failed:', err.message || err)
    throw err
  } finally {
    if (conn) await conn.end()
  }
}

main().catch(() => process.exit(1))

