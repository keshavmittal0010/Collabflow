'use client'

import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { useSocket } from '@/hooks/useSocket'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: false
          }
        }
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <SessionLoader>
        <SocketConnectionInitializer>{children}</SocketConnectionInitializer>
      </SessionLoader>
    </QueryClientProvider>
  )
}

function SocketConnectionInitializer({ children }: { children: React.ReactNode }) {
  // Call useSocket globally to connect and maintain the socket singleton connection when authenticated
  useSocket()
  return <>{children}</>
}

function SessionLoader({ children }: { children: React.ReactNode }) {
  const { restoreSession, isInitialized } = useAuth()

  useEffect(() => {
    restoreSession()
  }, [])

  if (!isInitialized) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-sans)',
          gap: '1.5rem'
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '4px solid var(--border-default)',
            borderTopColor: 'var(--accent-primary)',
            animation: 'spin 1s linear infinite'
          }}
        />
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          Securing workspace session...
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default Providers
