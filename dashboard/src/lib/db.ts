import { PrismaClient } from "@prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"

function makePrisma() {
  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL!
  })
  return new PrismaClient({ adapter })
}

// Prevent multiple instances in Next.js dev hot-reload
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? makePrisma()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
