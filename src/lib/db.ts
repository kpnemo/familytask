import { PrismaClient } from '@prisma/client'
import './db-config' // Ensure DIRECT_URL is set
import './env' // Validate environment variables

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db