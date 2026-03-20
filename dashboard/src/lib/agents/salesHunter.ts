import { prisma }  from "@/lib/db"
import Anthropic   from "@anthropic-ai/sdk"
import type { AgentResult } from "./index"

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function runSalesHunter(companyId?: string): Promise<AgentResult> {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 60)

  // Find customers who have NOT ordered in the last 60 days
  const recentBuyers = await prisma.order.findMany({
    where:  { date: { gte: cutoff }, ...(companyId ? { companyId } : {}) },
    select: { customerId: true },
    distinct: ["customerId"],
  })

  const recentIds = recentBuyers.map(o => o.customerId).filter(Boolean) as number[]

  const dormantCustomers = await prisma.customer.findMany({
    where: recentIds.length > 0 ? { id: { notIn: recentIds } } : {},
    take:  20,
    orderBy: { name: "asc" },
  })

  // Get some available titles for the email
  const topProducts = await prisma.product.findMany({
    where:   { stock: { gt: 0 } },
    take:    3,
    orderBy: { stock: "desc" },
    select:  { title: true, code: true },
  })
  const productList = topProducts.map(p => `"${p.title}" (${p.code})`).join(", ")

  let emailsDrafted = 0

  for (const customer of dormantCustomers) {
    try {
      const msg = await ai.messages.create({
        model:      "claude-haiku-4-5-20251001",
        max_tokens: 300,
        messages:   [{
          role:    "user",
          content: `Write a professional sales re-engagement email to ${customer.name}, a customer of NMI Education (Cameroonian publisher). They haven't ordered in 60+ days. The new academic term is approaching. We have these in stock: ${productList}. Mention a 10% loyalty discount for re-orders this month. Be warm, professional, brief (under 150 words). Start with "Dear ${customer.name}," — output only the email body, no subject line.`,
        }],
      })

      const body = msg.content[0]?.type === "text" ? msg.content[0].text : ""

      await prisma.emailLog.create({
        data: {
          from:      "nmi-agent@nmi-education.com",
          subject:   `A message from NMI Education — We miss you, ${customer.name}!`,
          body,
          category:  "sales",
          priority:  "normal",
          routedTo:  "Sales Team",
          handled:   false,
          companyId: companyId ?? null,
        },
      })
      emailsDrafted++
    } catch {
      // continue with next customer if one fails
    }
  }

  return {
    actions: emailsDrafted,
    summary: `Targeted ${dormantCustomers.length} dormant customers, drafted ${emailsDrafted} re-engagement emails`,
    details: { customersTargeted: dormantCustomers.length, emailsDrafted },
  }
}
