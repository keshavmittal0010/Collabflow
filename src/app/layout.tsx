import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'CollabFlow — Collaborate. Build. Deliver.',
    template: '%s | CollabFlow',
  },
  description:
    'CollabFlow is a real-time collaborative workspace platform for modern teams. Manage projects, chat, and collaborate — all in one place.',
  keywords: [
    'project management',
    'team collaboration',
    'workspace',
    'kanban',
    'real-time chat',
    'task management',
  ],
  authors: [{ name: 'CollabFlow Team' }],
  creator: 'CollabFlow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: 'CollabFlow — Collaborate. Build. Deliver.',
    description: 'Real-time collaborative workspace platform for modern teams.',
    siteName: 'CollabFlow',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CollabFlow — Collaborate. Build. Deliver.',
    description: 'Real-time collaborative workspace platform for modern teams.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  themeColor: '#6366f1',
  colorScheme: 'dark',
}

import Providers from '@/components/providers/Providers'
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
