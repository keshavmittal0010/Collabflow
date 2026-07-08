import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Image optimization — allow external domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.uploadthing.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
            },
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff',
            },
            {
              key: 'Referrer-Policy',
              value: 'origin-when-cross-origin',
            },
          ],
        },
      ]
    },

    // Redirect stubs to dashboard to prevent 404s
    async redirects() {
      return [
        {
          source: '/dashboard/workspaces',
          destination: '/dashboard',
          permanent: true,
        },
      ]
    },
  }

export default nextConfig
