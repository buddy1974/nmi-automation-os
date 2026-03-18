import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
})
const prisma = new PrismaClient({ adapter })

async function main() {
  await prisma.product.deleteMany()

  await prisma.product.createMany({
    data: [
      // ── French ──────────────────────────────────────────────────────────
      { code: "P-FR-1",    title: "French, Class 1",                        level: "Primary", class: "Primary 1",   subject: "French",                  author: "Unknown", royaltyType: "percent", royaltyValue: 10, price: 2500, stock: 0 },
      { code: "P-FR-2",    title: "French, Class 2",                        level: "Primary", class: "Primary 2",   subject: "French",                  author: "Unknown", royaltyType: "percent", royaltyValue: 10, price: 2500, stock: 0 },
      { code: "P-FR-3",    title: "French, Class 3",                        level: "Primary", class: "Primary 3",   subject: "French",                  author: "Unknown", royaltyType: "percent", royaltyValue: 10, price: 2500, stock: 0 },
      { code: "P-FR-4",    title: "French, Class 4",                        level: "Primary", class: "Primary 4",   subject: "French",                  author: "Unknown", royaltyType: "percent", royaltyValue: 10, price: 2500, stock: 0 },
      { code: "P-FR-5",    title: "French, Class 5",                        level: "Primary", class: "Primary 5",   subject: "French",                  author: "Unknown", royaltyType: "percent", royaltyValue: 10, price: 2500, stock: 0 },
      { code: "P-FR-6",    title: "French, Class 6",                        level: "Primary", class: "Primary 6",   subject: "French",                  author: "Unknown", royaltyType: "percent", royaltyValue: 10, price: 2500, stock: 0 },
      // ── English ─────────────────────────────────────────────────────────
      { code: "P-ENG-1",   title: "English, Class 1",                       level: "Primary", class: "Primary 1",   subject: "English",                 author: "Unknown", royaltyType: "percent", royaltyValue: 10, price: 2500, stock: 0 },
      { code: "P-ENG-2",   title: "English, Class 2",                       level: "Primary", class: "Primary 2",   subject: "English",                 author: "Unknown", royaltyType: "percent", royaltyValue: 10, price: 2500, stock: 0 },
      { code: "P-ENG-3",   title: "English, Class 3",                       level: "Primary", class: "Primary 3",   subject: "English",                 author: "Unknown", royaltyType: "percent", royaltyValue: 10, price: 2500, stock: 0 },
      { code: "P-ENG-4",   title: "English, Class 4",                       level: "Primary", class: "Primary 4",   subject: "English",                 author: "Unknown", royaltyType: "percent", royaltyValue: 10, price: 2500, stock: 0 },
      { code: "P-ENG-5",   title: "English, Class 5",                       level: "Primary", class: "Primary 5",   subject: "English",                 author: "Unknown", royaltyType: "percent", royaltyValue: 10, price: 2500, stock: 0 },
      { code: "P-ENG-6",   title: "English, Class 6",                       level: "Primary", class: "Primary 6",   subject: "English",                 author: "Unknown", royaltyType: "percent", royaltyValue: 10, price: 2500, stock: 0 },
      // ── Mathematics ─────────────────────────────────────────────────────
      { code: "P-MATH-1",  title: "Mathematics, Class 1",                   level: "Primary", class: "Primary 1",   subject: "Mathematics",             author: "Unknown", royaltyType: "percent", royaltyValue: 10, price: 2500, stock: 0 },
      { code: "P-MATH-2",  title: "Mathematics, Class 2",                   level: "Primary", class: "Primary 2",   subject: "Mathematics",             author: "Unknown", royaltyType: "percent", royaltyValue: 10, price: 2500, stock: 0 },
      { code: "P-MATH-3",  title: "Mathematics, Class 3",                   level: "Primary", class: "Primary 3",   subject: "Mathematics",             author: "Unknown", royaltyType: "percent", royaltyValue: 10, price: 2500, stock: 0 },
      { code: "P-MATH-4",  title: "Mathematics, Class 4",                   level: "Primary", class: "Primary 4",   subject: "Mathematics",             author: "Unknown", royaltyType: "percent", royaltyValue: 10, price: 2500, stock: 0 },
      { code: "P-MATH-5",  title: "Mathematics, Class 5",                   level: "Primary", class: "Primary 5",   subject: "Mathematics",             author: "Unknown", royaltyType: "percent", royaltyValue: 10, price: 2500, stock: 0 },
      { code: "P-MATH-6",  title: "Mathematics, Class 6",                   level: "Primary", class: "Primary 6",   subject: "Mathematics",             author: "Unknown", royaltyType: "percent", royaltyValue: 10, price: 2500, stock: 0 },
      // ── Sciences and Technology ─────────────────────────────────────────
      { code: "P-SCI-1",   title: "Sciences and Technology, Class 1",       level: "Primary", class: "Primary 1",   subject: "Sciences and Technology", author: "Unknown", royaltyType: "percent", royaltyValue: 10, price: 2500, stock: 0 },
      { code: "P-SCI-2",   title: "Sciences and Technology, Class 2",       level: "Primary", class: "Primary 2",   subject: "Sciences and Technology", author: "Unknown", royaltyType: "percent", royaltyValue: 10, price: 2500, stock: 0 },
      { code: "P-SCI-3",   title: "Sciences and Technology, Class 3",       level: "Primary", class: "Primary 3",   subject: "Sciences and Technology", author: "Unknown", royaltyType: "percent", royaltyValue: 10, price: 2500, stock: 0 },
      { code: "P-SCI-4",   title: "Sciences and Technology, Class 4",       level: "Primary", class: "Primary 4",   subject: "Sciences and Technology", author: "Unknown", royaltyType: "percent", royaltyValue: 10, price: 2500, stock: 0 },
      { code: "P-SCI-5",   title: "Sciences and Technology, Class 5",       level: "Primary", class: "Primary 5",   subject: "Sciences and Technology", author: "Unknown", royaltyType: "percent", royaltyValue: 10, price: 2500, stock: 0 },
      { code: "P-SCI-6",   title: "Sciences and Technology, Class 6",       level: "Primary", class: "Primary 6",   subject: "Sciences and Technology", author: "Unknown", royaltyType: "percent", royaltyValue: 10, price: 2500, stock: 0 },
      // ── Social Studies ──────────────────────────────────────────────────
      { code: "P-SOC-1-2", title: "Social Studies, Level 1 (Class 1 & 2)", level: "Primary", class: "Primary 1-2", subject: "Social Studies",          author: "Unknown", royaltyType: "percent", royaltyValue: 10, price: 2500, stock: 0 },
      { code: "P-SOC-3",   title: "Social Studies, Class 3",                level: "Primary", class: "Primary 3",   subject: "Social Studies",          author: "Unknown", royaltyType: "percent", royaltyValue: 10, price: 2500, stock: 0 },
      { code: "P-SOC-4",   title: "Social Studies, Class 4",                level: "Primary", class: "Primary 4",   subject: "Social Studies",          author: "Unknown", royaltyType: "percent", royaltyValue: 10, price: 2500, stock: 0 },
      { code: "P-SOC-5",   title: "Social Studies, Class 5",                level: "Primary", class: "Primary 5",   subject: "Social Studies",          author: "Unknown", royaltyType: "percent", royaltyValue: 10, price: 2500, stock: 0 },
      { code: "P-SOC-6",   title: "Social Studies, Class 6",                level: "Primary", class: "Primary 6",   subject: "Social Studies",          author: "Unknown", royaltyType: "percent", royaltyValue: 10, price: 2500, stock: 0 },
      // ── ICT ─────────────────────────────────────────────────────────────
      { code: "P-ICT-1-2", title: "ICT, Level 1 (Class 1 & 2)",            level: "Primary", class: "Primary 1-2", subject: "ICT",                     author: "Unknown", royaltyType: "percent", royaltyValue: 10, price: 2500, stock: 0 },
      { code: "P-ICT-3-4", title: "ICT, Level 2 (Class 3 & 4)",            level: "Primary", class: "Primary 3-4", subject: "ICT",                     author: "Unknown", royaltyType: "percent", royaltyValue: 10, price: 2500, stock: 0 },
      { code: "P-ICT-5-6", title: "ICT, Level 3 (Class 5 & 6)",            level: "Primary", class: "Primary 5-6", subject: "ICT",                     author: "Unknown", royaltyType: "percent", royaltyValue: 10, price: 2500, stock: 0 },
      // ── Handwriting ─────────────────────────────────────────────────────
      { code: "P-HW-1",    title: "Handwriting, Class 1",                   level: "Primary", class: "Primary 1",   subject: "Handwriting",             author: "Unknown", royaltyType: "percent", royaltyValue: 10, price: 2500, stock: 0 },
      { code: "P-HW-2",    title: "Handwriting, Class 2",                   level: "Primary", class: "Primary 2",   subject: "Handwriting",             author: "Unknown", royaltyType: "percent", royaltyValue: 10, price: 2500, stock: 0 },
    ],
  })

  console.log("Seeded 34 products successfully")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
