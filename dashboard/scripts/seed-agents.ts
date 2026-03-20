import "dotenv/config"
import { PrismaNeon }   from "@prisma/adapter-neon"
import { PrismaClient } from "@prisma/client"

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const prisma  = new PrismaClient({ adapter })

const AGENT_SEEDS = [
  {
    agentId:     "sales_hunter",
    name:        "Sales Hunter",
    description: "Finds dormant customers (60+ days) and drafts personalised re-engagement emails",
    schedule:    "Every Monday 08:00",
    enabled:     true,
  },
  {
    agentId:     "receivables",
    name:        "Receivables Agent",
    description: "Finds unpaid invoices >30 days and drafts professional payment reminders",
    schedule:    "Daily 09:00",
    enabled:     true,
  },
  {
    agentId:     "author_relations",
    name:        "Author Relations",
    description: "Monitors manuscript status changes and royalties due; drafts author update emails",
    schedule:    "Every Wednesday 10:00",
    enabled:     true,
  },
  {
    agentId:     "stock_intelligence",
    name:        "Stock Intelligence",
    description: "Detects low-stock products and creates restock tasks for the printing department",
    schedule:    "Daily 07:00",
    enabled:     true,
  },
  {
    agentId:     "competitive_intel",
    name:        "Competitive Intel",
    description: "Generates an AI briefing on Cameroonian educational publishing market trends",
    schedule:    "Weekly Monday 07:00",
    enabled:     true,
  },
  {
    agentId:     "hr_pulse",
    name:        "HR Pulse",
    description: "Monitors attendance gaps, overdue tasks, and missing evaluations; alerts HR",
    schedule:    "Daily 08:30",
    enabled:     true,
  },
  {
    agentId:     "financial_forecast",
    name:        "Financial Forecast",
    description: "Analyses 6-month revenue trend and generates a 3-month AI forecast narrative",
    schedule:    "1st of month 06:00",
    enabled:     true,
  },
  {
    agentId:     "document_intel",
    name:        "Document Intel",
    description: "Processes new knowledge base docs — extracts entities, summaries, and action items",
    schedule:    "Daily 06:30",
    enabled:     true,
  },
]

async function main() {
  console.log("Seeding agent configurations...")
  for (const seed of AGENT_SEEDS) {
    await prisma.agentConfig.upsert({
      where:  { agentId: seed.agentId },
      update: { name: seed.name, description: seed.description, schedule: seed.schedule },
      create: seed,
    })
    console.log(`  ✓ ${seed.name}`)
  }
  console.log(`Done — ${AGENT_SEEDS.length} agents configured.`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
