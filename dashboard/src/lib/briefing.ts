import { prisma }  from "@/lib/db"
import Anthropic   from "@anthropic-ai/sdk"

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const SYSTEM_PROMPT = `You are the NMI Intelligence briefing engine. Write a concise, professional morning briefing for the CEO of NMI Education. Use clear sections. Be direct. Flag urgent items clearly. Use XAF for currency. Write in a confident executive tone. Maximum 300 words.`

export interface BriefingData {
  date:              string
  yesterdayOrders:   number
  yesterdayRevenue:  number
  pendingInvoices:   number
  pendingInvoiceAmt: number
  unreadNotifs:      number
  urgentNotifs:      number
  openTasks:         number
  overdueTasks:      number
  lowStockItems:     number
  lowStockTitles:    string[]
  unpaidRoyalties:   number
  unpaidRoyaltyAmt:  number
  unhandledWhatsApp: number
  unhandledEmails:   number
  urgentEmails:      number
  topPerformer:      string | null
  topPerformerScore: number | null
  clockedInToday:    number
}

export interface BriefingResult {
  briefing:    string
  data:        BriefingData
  generatedAt: Date
}

export async function generateDailyBriefing(companyId?: string): Promise<BriefingResult> {
  const now       = new Date()
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
  const yesterday  = new Date(todayStart); yesterday.setDate(yesterday.getDate() - 1)

  const companyFilter = companyId ? { companyId } : {}

  // Fetch all data in parallel
  const [
    yesterdayOrders,
    pendingInvoices,
    unreadNotifs,
    openTasks,
    overdueTasks,
    lowStock,
    unpaidRoyalties,
    unhandledWA,
    unhandledEmails,
    urgentEmails,
    topPerformer,
    clockedIn,
  ] = await Promise.all([
    // Yesterday's orders
    prisma.order.findMany({
      where: { ...companyFilter, date: { gte: yesterday, lt: todayStart } },
      select: { total: true },
    }),

    // Pending invoices
    prisma.invoice.findMany({
      where: { ...companyFilter, status: { in: ["issued", "partial"] } },
      select: { amount: true, paid: true },
    }),

    // Notifications
    prisma.notification.findMany({
      where: { ...companyFilter, read: false },
      select: { severity: true },
    }),

    // Open tasks
    prisma.task.count({ where: { ...companyFilter, status: { not: "done" } } }),

    // Overdue tasks
    prisma.task.count({ where: { ...companyFilter, status: { not: "done" }, dueDate: { lt: now } } }),

    // Low stock
    prisma.product.findMany({ where: { stock: { lt: 10 } }, select: { code: true, stock: true } }),

    // Unpaid royalties
    prisma.royalty.findMany({ where: { status: "unpaid" }, select: { amount: true } }),

    // Unhandled WhatsApp
    prisma.whatsAppMessage.count({ where: { ...companyFilter, handled: false } }),

    // Unhandled emails
    prisma.emailLog.count({ where: { ...companyFilter, handled: false } }),

    // Urgent emails
    prisma.emailLog.count({ where: { ...companyFilter, priority: "urgent", handled: false } }),

    // Top performer this month
    prisma.evaluationSession.findFirst({
      where:   { ...(companyId ? { companyId } : {}), createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } },
      orderBy: { totalScore: "desc" },
      select:  { workerName: true, totalScore: true },
    }),

    // Clocked in today
    prisma.workSession.count({
      where: { ...(companyId ? { companyId } : {}), clockIn: { gte: todayStart }, clockOut: null },
    }),
  ])

  const data: BriefingData = {
    date:              now.toISOString().slice(0, 10),
    yesterdayOrders:   yesterdayOrders.length,
    yesterdayRevenue:  yesterdayOrders.reduce((s, o) => s + Number(o.total), 0),
    pendingInvoices:   pendingInvoices.length,
    pendingInvoiceAmt: pendingInvoices.reduce((s, i) => s + Number(i.amount) - Number(i.paid), 0),
    unreadNotifs:      unreadNotifs.length,
    urgentNotifs:      unreadNotifs.filter(n => n.severity === "high").length,
    openTasks,
    overdueTasks,
    lowStockItems:     lowStock.length,
    lowStockTitles:    lowStock.map(p => p.code),
    unpaidRoyalties:   unpaidRoyalties.length,
    unpaidRoyaltyAmt:  unpaidRoyalties.reduce((s, r) => s + Number(r.amount), 0),
    unhandledWhatsApp: unhandledWA,
    unhandledEmails:   unhandledEmails,
    urgentEmails,
    topPerformer:      topPerformer?.workerName ?? null,
    topPerformerScore: topPerformer?.totalScore ?? null,
    clockedInToday:    clockedIn,
  }

  // Build structured prompt for Claude
  const dataBlock = [
    `Date: ${data.date}`,
    `Yesterday: ${data.yesterdayOrders} orders — ${data.yesterdayRevenue.toLocaleString()} XAF revenue`,
    `Pending invoices: ${data.pendingInvoices} outstanding — ${data.pendingInvoiceAmt.toLocaleString()} XAF uncollected`,
    `Notifications: ${data.unreadNotifs} unread, ${data.urgentNotifs} urgent`,
    `Tasks: ${data.openTasks} open, ${data.overdueTasks} overdue`,
    `Low stock: ${data.lowStockItems} titles${data.lowStockTitles.length ? " (" + data.lowStockTitles.slice(0, 3).join(", ") + (data.lowStockTitles.length > 3 ? "…" : "") + ")" : ""}`,
    `Unpaid royalties: ${data.unpaidRoyalties} authors — ${data.unpaidRoyaltyAmt.toLocaleString()} XAF`,
    `WhatsApp: ${data.unhandledWhatsApp} unhandled messages`,
    `Email: ${data.unhandledEmails} unhandled, ${data.urgentEmails} urgent`,
    `Top performer this month: ${data.topPerformer ?? "no evaluations yet"}${data.topPerformerScore !== null ? " (" + data.topPerformerScore.toFixed(1) + "/100)" : ""}`,
    `Staff clocked in today: ${data.clockedInToday}`,
  ].join("\n")

  let briefing = ""
  try {
    const msg = await ai.messages.create({
      model:      "claude-sonnet-4-6",
      max_tokens: 500,
      system:     SYSTEM_PROMPT,
      messages:   [{ role: "user", content: `Today's business data:\n\n${dataBlock}\n\nWrite the CEO morning briefing.` }],
    })
    briefing = (msg.content[0] as { type: string; text: string }).text.trim()
  } catch {
    // Fallback: structured plain-text briefing
    briefing = [
      `NMI EDUCATION — MORNING BRIEFING`,
      `${data.date}`,
      ``,
      `SALES`,
      `${data.yesterdayOrders} orders yesterday generating ${data.yesterdayRevenue.toLocaleString()} XAF.`,
      `${data.pendingInvoices} invoices pending — ${data.pendingInvoiceAmt.toLocaleString()} XAF outstanding.`,
      ``,
      `OPERATIONS`,
      `${data.openTasks} open tasks, ${data.overdueTasks} overdue.`,
      `${data.clockedInToday} staff clocked in today.`,
      data.lowStockItems > 0 ? `⚠ ${data.lowStockItems} titles below stock threshold.` : `Stock levels normal.`,
      ``,
      `COMMUNICATIONS`,
      `${data.unhandledWhatsApp} unhandled WhatsApp messages.`,
      `${data.unhandledEmails} unhandled emails${data.urgentEmails > 0 ? `, ${data.urgentEmails} urgent` : ""}.`,
      ``,
      `FINANCE`,
      `${data.unpaidRoyalties} unpaid royalty accounts — ${data.unpaidRoyaltyAmt.toLocaleString()} XAF.`,
    ].join("\n")
  }

  return { briefing, data, generatedAt: now }
}
