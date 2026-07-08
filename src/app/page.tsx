import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CollabFlow — Collaborate. Build. Deliver.',
  description:
    'The real-time collaborative workspace platform for modern teams. Manage projects, chat with your team, and ship faster — all in one beautiful platform.',
}

const features = [
  {
    icon: '⚡',
    title: 'Real-time Everything',
    description:
      'Live cursor tracking, instant task updates, and real-time chat. Your team is always in sync.',
  },
  {
    icon: '📋',
    title: 'Powerful Task Management',
    description:
      'Kanban boards, list views, calendar views. Drag-and-drop tasks with priorities, labels, and due dates.',
  },
  {
    icon: '💬',
    title: 'Team Chat',
    description:
      'Slack-style channels and direct messages. Thread replies, emoji reactions, @mentions, and file sharing.',
  },
  {
    icon: '📝',
    title: 'Collaborative Docs',
    description:
      'Write and edit documents together in real-time. Rich text, code blocks, embeds, and version history.',
  },
  {
    icon: '🔔',
    title: 'Smart Notifications',
    description:
      'Stay in the loop with intelligent notifications for mentions, task assignments, and deadlines.',
  },
  {
    icon: '📊',
    title: 'Analytics Dashboard',
    description:
      'Velocity charts, burndown charts, team workload, and project health at a glance.',
  },
]

const stack = [
  { name: 'Next.js 15', color: '#ffffff' },
  { name: 'React 19', color: '#61dafb' },
  { name: 'TypeScript', color: '#3178c6' },
  { name: 'Tailwind CSS', color: '#38bdf8' },
  { name: 'Prisma', color: '#5a67d8' },
  { name: 'MySQL', color: '#f29111' },
  { name: 'Socket.io', color: '#25c2a0' },
  { name: 'JWT Auth', color: '#d63aff' },
]

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Gradient mesh background */}
      <div className="gradient-mesh" style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />

      {/* Navbar */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          height: 'var(--navbar-height)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2rem',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border-default)',
          background: 'rgba(7, 7, 15, 0.8)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
            }}
          >
            ⚡
          </div>
          <span
            style={{
              fontSize: '1.125rem',
              fontWeight: 700,
              letterSpacing: '-0.03em',
            }}
            className="gradient-text"
          >
            CollabFlow
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link
            href="/login"
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'color 0.15s',
            }}
          >
            Sign In
          </Link>
          <Link
            href="/register"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.5rem 1.25rem',
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#ffffff',
              fontSize: '0.875rem',
              fontWeight: 600,
              transition: 'opacity 0.15s, transform 0.15s',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)',
            }}
          >
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          minHeight: '100vh',
          padding: '6rem 2rem 4rem',
          gap: '2rem',
        }}
      >
        {/* Badge */}
        <div className="badge badge-primary animate-fade-in-down">
          <span>✨</span>
          <span>Now in Early Access — Phase 1 Complete</span>
        </div>

        {/* Headline */}
        <h1
          className="animate-fade-in-up"
          style={{
            fontSize: 'clamp(2.5rem, 7vw, 5rem)',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            lineHeight: 1.05,
            maxWidth: '800px',
            animationDelay: '100ms',
          }}
        >
          Collaborate.{' '}
          <span className="gradient-text">Build.</span>{' '}
          Deliver.
        </h1>

        {/* Subheadline */}
        <p
          className="animate-fade-in-up"
          style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
            color: 'var(--text-secondary)',
            maxWidth: '600px',
            lineHeight: 1.7,
            animationDelay: '200ms',
          }}
        >
          The real-time collaborative workspace where your team manages projects,
          ships tasks, and communicates — all in one beautifully designed platform.
        </p>

        {/* CTA Buttons */}
        <div
          className="animate-fade-in-up"
          style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            justifyContent: 'center',
            animationDelay: '300ms',
          }}
        >
          <Link
            href="/register"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.875rem 2rem',
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#ffffff',
              fontSize: '1rem',
              fontWeight: 600,
              boxShadow: '0 0 40px rgba(99, 102, 241, 0.4)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            id="cta-get-started"
          >
            Start for Free →
          </Link>
          <Link
            href="#features"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.875rem 2rem',
              borderRadius: 'var(--radius-full)',
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(12px)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-primary)',
              fontSize: '1rem',
              fontWeight: 500,
            }}
            id="cta-see-features"
          >
            See Features
          </Link>
        </div>

        {/* Social Proof */}
        <p
          className="animate-fade-in"
          style={{
            fontSize: '0.8125rem',
            color: 'var(--text-muted)',
            animationDelay: '400ms',
          }}
        >
          No credit card required · Free forever plan · Open source
        </p>

        {/* Hero Visual — Dashboard Preview */}
        <div
          className="animate-fade-in-up glow-strong"
          style={{
            width: '100%',
            maxWidth: '900px',
            marginTop: '2rem',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-default)',
            background: 'var(--bg-secondary)',
            overflow: 'hidden',
            animationDelay: '400ms',
          }}
        >
          {/* Mock browser chrome */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              borderBottom: '1px solid var(--border-default)',
              background: 'var(--bg-tertiary)',
            }}
          >
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444', opacity: 0.8 }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b', opacity: 0.8 }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#22c55e', opacity: 0.8 }} />
            <div
              style={{
                flex: 1,
                height: 24,
                background: 'var(--bg-elevated)',
                borderRadius: 6,
                marginLeft: 8,
                display: 'flex',
                alignItems: 'center',
                paddingLeft: 12,
              }}
            >
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                app.collabflow.io/workspace/my-team
              </span>
            </div>
          </div>

          {/* Mock dashboard layout */}
          <div style={{ display: 'flex', height: '400px' }}>
            {/* Sidebar */}
            <div
              style={{
                width: '200px',
                borderRight: '1px solid var(--border-default)',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              {/* Logo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>My Team</span>
              </div>

              {/* Nav items */}
              {['Overview', 'Projects', 'Chat', 'Members', 'Analytics'].map((item, i) => (
                <div
                  key={item}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: 8,
                    background: i === 1 ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                    color: i === 1 ? 'var(--accent-tertiary)' : 'var(--text-secondary)',
                    fontSize: '0.8125rem',
                    fontWeight: i === 1 ? 500 : 400,
                    cursor: 'pointer',
                  }}
                >
                  {item}
                </div>
              ))}
            </div>

            {/* Main content — Kanban board */}
            <div style={{ flex: 1, padding: '1.25rem', overflow: 'hidden' }}>
              <div style={{ marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                🚀 CollabFlow v1.0 — Sprint 1
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', height: '300px' }}>
                {[
                  { name: 'To Do', color: '#475569', tasks: ['Design system', 'Auth API', 'DB Schema'] },
                  { name: 'In Progress', color: '#6366f1', tasks: ['Landing page', 'Socket setup'] },
                  { name: 'In Review', color: '#f59e0b', tasks: ['Task board'] },
                  { name: 'Done', color: '#22c55e', tasks: ['Project setup', 'Planning'] },
                ].map((col) => (
                  <div
                    key={col.name}
                    style={{
                      flex: '1',
                      minWidth: 0,
                      background: 'var(--bg-tertiary)',
                      borderRadius: 10,
                      padding: '0.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {col.name}
                      </span>
                      <span
                        style={{
                          marginLeft: 'auto',
                          fontSize: '0.7rem',
                          background: 'var(--bg-elevated)',
                          padding: '1px 6px',
                          borderRadius: 4,
                          color: 'var(--text-muted)',
                        }}
                      >
                        {col.tasks.length}
                      </span>
                    </div>
                    {col.tasks.map((task) => (
                      <div
                        key={task}
                        style={{
                          background: 'var(--bg-secondary)',
                          borderRadius: 8,
                          padding: '0.5rem 0.625rem',
                          fontSize: '0.75rem',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-default)',
                          cursor: 'pointer',
                        }}
                      >
                        {task}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        style={{
          position: 'relative',
          zIndex: 1,
          padding: '5rem 2rem',
          maxWidth: '1100px',
          margin: '0 auto',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div className="badge badge-primary" style={{ marginBottom: '1rem', display: 'inline-flex' }}>
            Features
          </div>
          <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 800, letterSpacing: '-0.03em' }}>
            Everything your team needs
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.75rem', maxWidth: '500px', margin: '0.75rem auto 0' }}>
            From project planning to real-time collaboration — CollabFlow has it all.
          </p>
        </div>

        <div
          className="stagger"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {features.map((feature) => (
            <div
              key={feature.title}
              className="card-glass animate-fade-in-up"
              style={{ padding: '1.5rem' }}
            >
              <div style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>{feature.icon}</div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>{feature.title}</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack Section */}
      <section
        style={{
          position: 'relative',
          zIndex: 1,
          padding: '4rem 2rem',
          textAlign: 'center',
          borderTop: '1px solid var(--border-default)',
        }}
      >
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.5rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Built with world-class technology
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center', maxWidth: '700px', margin: '0 auto' }}>
          {stack.map((tech) => (
            <span
              key={tech.name}
              style={{
                padding: '0.375rem 0.875rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-default)',
                background: 'var(--glass-bg)',
                fontSize: '0.8125rem',
                fontWeight: 500,
                color: 'var(--text-secondary)',
              }}
            >
              {tech.name}
            </span>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section
        style={{
          position: 'relative',
          zIndex: 1,
          padding: '5rem 2rem',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            maxWidth: '600px',
            margin: '0 auto',
            padding: '3rem 2rem',
            borderRadius: 'var(--radius-xl)',
            background: 'var(--glass-bg)',
            backdropFilter: 'var(--glass-blur)',
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--shadow-glow)',
          }}
        >
          <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '1rem' }}>
            Ready to build together?
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
            Join teams who collaborate smarter with CollabFlow.
          </p>
          <Link
            href="/register"
            id="cta-footer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.875rem 2.5rem',
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#ffffff',
              fontSize: '1rem',
              fontWeight: 600,
              boxShadow: '0 0 40px rgba(99, 102, 241, 0.4)',
            }}
          >
            Create Free Account →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          position: 'relative',
          zIndex: 1,
          padding: '2rem',
          textAlign: 'center',
          borderTop: '1px solid var(--border-default)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <div
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '5px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
            }}
          >
            ⚡
          </div>
          <span className="gradient-text" style={{ fontWeight: 700, fontSize: '0.875rem' }}>CollabFlow</span>
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          © 2026 CollabFlow. Built with ❤️ as a portfolio-quality SaaS.
        </p>
      </footer>
    </main>
  )
}
