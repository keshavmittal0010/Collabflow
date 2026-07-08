import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

// Prevent multiple Prisma Client instances in development (Next.js hot reload)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Parse DATABASE_URL: mysql://user:password@host:port/database
function parseDbUrl(url: string) {
  const match = url.match(/(?:mysql|mariadb):\/\/([^:]+):([^@]+)@([^:/]+):(\d+)\/(.+)/)
  if (!match) throw new Error('Invalid DATABASE_URL format: ' + url)
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: parseInt(match[4]),
    database: match[5],
    connectionLimit: 10,
    connectTimeout: 10000,
  }
}

function createPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) throw new Error('DATABASE_URL is not defined in environment variables')

  // PrismaMariaDb accepts a PoolConfig object or a connection string
  const config = parseDbUrl(dbUrl)
  const adapter = new PrismaMariaDb(config as any)
  return new PrismaClient({ adapter })
}

let prismaClientInstance: PrismaClient

if (process.env.NODE_ENV === 'production') {
  prismaClientInstance = createPrismaClient()
} else {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient()
  }
  prismaClientInstance = globalForPrisma.prisma
}

export const prisma = prismaClientInstance
export default prisma

