import { prisma }  from "@/lib/db"
import type { AgentResult } from "./index"

export async function runStockIntelligence(_companyId?: string): Promise<AgentResult> {
  const lowStockProducts = await prisma.product.findMany({
    where:   { stock: { lt: 20 } },
    orderBy: { stock: "asc" },
  })

  let tasksCreated         = 0
  let notificationsCreated = 0

  for (const p of lowStockProducts) {
    const title    = `Restock needed: ${p.title}`
    const priority = p.stock === 0 ? "urgent" : p.stock < 5 ? "high" : "medium"

    // Check if task already exists
    const existing = await prisma.task.findFirst({
      where: { title, status: { not: "done" } },
    })

    if (!existing) {
      await prisma.task.create({
        data: {
          title,
          description: `Product ${p.code} — "${p.title}" has ${p.stock} unit${p.stock === 1 ? "" : "s"} remaining. Restock to at least 50 units.`,
          status:     "todo",
          priority,
          department: "Printing",
        },
      })
      tasksCreated++
    }

    // Notification (always create, deduplication on read side)
    const existingNotif = await prisma.notification.findFirst({
      where: { type: "low_stock_alert", title: `Low stock: ${p.code}`, read: false },
    })

    if (!existingNotif) {
      await prisma.notification.create({
        data: {
          type:     "low_stock_alert",
          title:    `Low stock: ${p.code}`,
          message:  `"${p.title}" — ${p.stock} unit${p.stock === 1 ? "" : "s"} remaining. Restock task created for Printing department.`,
          severity: p.stock === 0 ? "high" : "medium",
        },
      })
      notificationsCreated++
    }
  }

  return {
    actions: tasksCreated + notificationsCreated,
    summary: `Found ${lowStockProducts.length} low-stock products, created ${tasksCreated} tasks and ${notificationsCreated} notifications`,
    details: { lowStockFound: lowStockProducts.length, tasksCreated, notificationsCreated },
  }
}
