import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaNeon }   from "@prisma/adapter-neon"
import bcrypt           from "bcryptjs"

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const prisma  = new PrismaClient({ adapter })

const USERS = [
  { name: "Rogers Nforgwei", email: "rogers@nmi.cm",  password: "nmi2025",  role: "owner" },
  { name: "Admin NMI",       email: "admin@nmi.cm",   password: "nmi2025",  role: "admin" },
  { name: "Sales Manager",   email: "sales@nmi.cm",   password: "nmi2025",  role: "manager" },
  { name: "HR Officer",      email: "hr@nmi.cm",      password: "nmi2025",  role: "hr" },
]

async function main() {
  console.log("Seeding test users…\n")

  for (const u of USERS) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } })
    if (existing) {
      console.log(`  ⚠  Skipped (already exists): ${u.name} <${u.email}>`)
      continue
    }
    const hashed = await bcrypt.hash(u.password, 10)
    await prisma.user.create({
      data: { name: u.name, email: u.email, password: hashed, role: u.role, active: true },
    })
    console.log(`  ✓  Created [${u.role.padEnd(7)}] ${u.name} <${u.email}>`)
  }

  console.log("\nDone.")
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
