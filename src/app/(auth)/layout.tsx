// Route group layout for auth pages (login, register, forgot-password)
// No sidebar/navbar - clean centered layout
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background gradient */}
      <div
        className="gradient-mesh"
        style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
      />

      {/* Auth content */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', padding: '2rem' }}>
        {children}
      </div>
    </div>
  )
}
