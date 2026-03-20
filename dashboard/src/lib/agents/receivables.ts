import { prisma }  from "@/lib/db"
import Anthropic   from "@anthropic-ai/sdk"
import type { AgentResult } from "./index"

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function runReceivables(companyId?: string): Promise<AgentResult> {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 30)

  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      status:  { not: "paid" },
      dueDate: { lt: cutoff },
      ...(companyId ? { companyId } : {}),
    },
    orderBy: { dueDate: "asc" },
    take:    50,
  })

  let remindersDrafted = 0

  for (const inv of overdueInvoices) {
    try {
      const daysOverdue = Math.floor((Date.now() - new Date(inv.dueDate).getTime()) / 86400000)

      const msg = await ai.messages.create({
        model:      "claude-haiku-4-5-20251001",
        max_tokens: 300,
        messages:   [{
          role:    "user",
          content: `Write a professional payment reminder email for NMI Education. Invoice number: ${inv.number ?? inv.id}. Customer: ${inv.customerName ?? "Valued Customer"}. Amount due: ${Number(inv.amount).toLocaleString()} XAF. Days overdue: ${daysOverdue}. Be firm but polite. Payment can be made via bank transfer to NMI Education account. Request payment within 5 business days. Under 150 words. Output only the email body.`,
        }],
      })

      const body = msg.content[0]?.type === "text" ? msg.content[0].text : ""

      await prisma.emailLog.create({
        data: {
          from:      "accounts@nmi-education.com",
          subject:   `Payment Reminder — Invoice ${inv.number ?? inv.id} — ${Number(inv.amount).toLocaleString()} XAF`,
          body,
          category:  "accounting",
          priority:  "high",
          routedTo:  "Accounts Team",
          handled:   false,
          companyId: companyId ?? null,
        },
      })

      await prisma.notification.create({
        data: {
          type:      "receivables_reminder",
          title:     `Payment reminder sent: ${inv.customerName ?? inv.number}`,
          message:   `Invoice ${inv.number ?? inv.id} — ${Number(inv.amount).toLocaleString()} XAF — ${daysOverdue} days overdue`,
          severity:  daysOverdue > 60 ? "high" : "medium",
          companyId: companyId ?? null,
        },
      })

      remindersDrafted++
    } catch {
      // continue
    }
  }

  return {
    actions: remindersDrafted,
    summary: `Found ${overdueInvoices.length} overdue invoices, drafted ${remindersDrafted} payment reminders`,
    details: { invoicesFound: overdueInvoices.length, remindersDrafted },
  }
}
