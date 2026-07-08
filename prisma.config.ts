import dotenv from 'dotenv'
import path from 'path'
import { defineConfig, env } from 'prisma/config'

// Load local overrides first, then fall back to .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config()

export default defineConfig({
  schema: './prisma/schema.prisma',
  migrations: {
    seed: 'node ./prisma/seed.js',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})
