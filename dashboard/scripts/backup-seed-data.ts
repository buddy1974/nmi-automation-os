/**
 * backup-seed-data.ts
 * Exports current DB state for products, companies, distributors, and workers
 * to docs/seed-snapshot.json as a point-in-time reference backup.
 *
 * Usage: npm run backup
 */

import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaNeon }   from "@prisma/adapter-neon"
import { writeFileSync, mkdirSync } from "fs"
import { join }         from "path"

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const prisma  = new PrismaClient({ adapter })

async function main() {
  console.log("📦 Fetching seed data from database…")

  const [products, companies, distributors, workers, branches] = await Promise.all([
    prisma.product.findMany({ orderBy: { code: "asc" } }),
    prisma.company.findMany({ orderBy: { name: "asc" } }),
    prisma.distributor.findMany({ orderBy: { name: "asc" } }),
    prisma.worker.findMany({ orderBy: { name: "asc" } }),
    prisma.branch.findMany({ orderBy: { name: "asc" } }),
  ])

  const snapshot = {
    exportedAt:   new Date().toISOString(),
    counts: {
      products:     products.length,
      companies:    companies.length,
      distributors: distributors.length,
      workers:      workers.length,
      branches:     branches.length,
    },
    products,
    companies,
    distributors,
    workers,
    branches,
  }

  const outDir  = join(process.cwd(), "docs")
  const outPath = join(outDir, "seed-snapshot.json")

  mkdirSync(outDir, { recursive: true })
  writeFileSync(outPath, JSON.stringify(snapshot, null, 2), "utf-8")

  console.log(`✅ Snapshot saved to docs/seed-snapshot.json`)
  console.log(`   Products:     ${products.length}`)
  console.log(`   Companies:    ${companies.length}`)
  console.log(`   Distributors: ${distributors.length}`)
  console.log(`   Workers:      ${workers.length}`)
  console.log(`   Branches:     ${branches.length}`)
}

main()
  .catch(err => { console.error("❌ Backup failed:", err); process.exit(1) })
  .finally(() => prisma.$disconnect())
