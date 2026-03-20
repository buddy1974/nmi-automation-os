import { NextResponse } from "next/server"
import { prisma }       from "@/lib/db"
import { requireAuth }  from "@/lib/api-auth"
import { checkRateLimit } from "@/lib/rateLimit"
import Anthropic        from "@anthropic-ai/sdk"

export const runtime = "nodejs"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

type HistoryMsg = { role: "user" | "assistant"; content: string }

// ── DB context fetcher ────────────────────────────────────────────────────────
// Detects keywords in the message and fetches relevant data.
// Role-scoped: admin/owner see everything; others filtered by companyId.

async function fetchContext(
  message:   string,
  role:      string,
  name:      string,
  companyId?: string,
): Promise<string> {
  const q     = message.toLowerCase()
  const parts: string[] = []

  const isPrivileged = role === "admin" || role === "owner"
  const cFilter      = !isPrivileged && companyId ? { companyId } : {}

  // ── Stock / Inventory ──────────────────────────────────────────────────────
  if (/stock|inventory|product|copies|units/.test(q)) {
    const products = await prisma.product.findMany({
      orderBy: { stock: "asc" },
      take:    30,
    })
    const low = products.filter(p => p.stock < 10)
    parts.push(`=== STOCK LEVELS (${products.length} products, ${low.length} low) ===`)
    for (const p of products) {
      parts.push(`${p.code} | "${p.title}" | ${p.stock} units${p.stock === 0 ? " ⛔ OUT" : p.stock < 10 ? " ⚠ LOW" : ""}`)
    }
  }

  // ── Royalties ─────────────────────────────────────────────────────────────
  if (/royalt|payment.*author|author.*pay/.test(q)) {
    const royalties = await prisma.royalty.findMany({ orderBy: { date: "desc" }, take: 25 })
    const unpaid    = royalties.filter(r => r.status === "unpaid")
    const totalOwed = unpaid.reduce((s, r) => s + Number(r.amount), 0)
    parts.push(`=== ROYALTIES (${royalties.length} total | ${unpaid.length} unpaid | ${totalOwed.toLocaleString()} XAF owed) ===`)
    for (const r of royalties) {
      parts.push(`${r.author} | "${r.book}" | ${Number(r.amount).toLocaleString()} XAF | ${r.status} | ${new Date(r.date).toLocaleDateString()}`)
    }
  }

  // ── Workers / HR / Performance ────────────────────────────────────────────
  if (/worker|employee|staff|team|perform|hr|human|salary|\bwho\b|giselle|tambe|john|paul|marie/.test(q)) {
    const workers = await prisma.worker.findMany({
      where:  isPrivileged ? {} : cFilter,
      select: { id: true, name: true, role: true, contractType: true, status: true, salaryBase: true },
      take:   30,
    })
    const perfs = await prisma.performanceRecord.findMany({
      select:  { workerId: true, scorePercent: true, rating: true, recommendation: true, period: true },
      orderBy: { createdAt: "desc" },
    })
    const perfMap = new Map<number, typeof perfs[0]>()
    for (const p of perfs) if (!perfMap.has(p.workerId)) perfMap.set(p.workerId, p)

    parts.push(`=== WORKERS (${workers.length} shown) ===`)
    for (const w of workers) {
      const perf = perfMap.get(w.id)
      parts.push(
        `${w.name} | ${w.role} | ${w.contractType} | ${w.status}` +
        (perf ? ` | Score: ${perf.scorePercent.toFixed(0)}% | ${perf.rating} | ${perf.recommendation ?? ""}` : " | No performance record")
      )
    }
  }

  // ── Orders / Sales / Revenue ──────────────────────────────────────────────
  if (/order|sale|revenue|income|earn|turnover|money|xaf/.test(q)) {
    const orders = await prisma.order.findMany({
      where:   isPrivileged ? {} : cFilter,
      orderBy: { date: "desc" },
      take:    20,
      select:  { number: true, customerName: true, total: true, status: true, date: true },
    })
    const total = orders.reduce((s, o) => s + Number(o.total), 0)
    parts.push(`=== RECENT ORDERS (${orders.length} shown | ${total.toLocaleString()} XAF total) ===`)
    for (const o of orders) {
      parts.push(`${o.number} | ${o.customerName} | ${Number(o.total).toLocaleString()} XAF | ${o.status} | ${new Date(o.date).toLocaleDateString()}`)
    }
  }

  // ── Invoices ──────────────────────────────────────────────────────────────
  if (/invoice|billing|outstanding|due|overdue|collect/.test(q)) {
    const invoices = await prisma.invoice.findMany({
      where:   isPrivileged ? {} : cFilter,
      orderBy: { createdAt: "desc" },
      take:    20,
    })
    const unpaid  = invoices.filter(i => i.status !== "paid" && i.status !== "cancelled")
    const totalDue = unpaid.reduce((s, i) => s + (Number(i.amount) - Number(i.paid)), 0)
    parts.push(`=== INVOICES (${invoices.length} total | ${unpaid.length} outstanding | ${totalDue.toLocaleString()} XAF due) ===`)
    for (const inv of invoices) {
      const bal = Number(inv.amount) - Number(inv.paid)
      parts.push(`${inv.number} | ${inv.customerName} | ${Number(inv.amount).toLocaleString()} XAF | ${inv.status}${bal > 0 ? ` | balance: ${bal.toLocaleString()} XAF` : " | PAID"}`)
    }
  }

  // ── Manuscripts / Editorial ───────────────────────────────────────────────
  if (/manuscript|editorial|author|publish|ready.?print|chapter|draft/.test(q)) {
    const manuscripts = await prisma.manuscript.findMany({ orderBy: { date: "desc" }, take: 20 })
    const ready       = manuscripts.filter(m => m.readyForPrint)
    parts.push(`=== MANUSCRIPTS (${manuscripts.length} total | ${ready.length} ready to print) ===`)
    for (const m of manuscripts) {
      parts.push(`"${m.title}" | ${m.author || "unknown author"} | ${m.status}${m.readyForPrint ? " | ✓ READY TO PRINT" : ""}`)
    }
  }

  // ── Distributors ──────────────────────────────────────────────────────────
  if (/distribut|region|network|partner|cameroon/.test(q)) {
    const distributors = await prisma.distributor.findMany({ orderBy: { region: "asc" } })
    const active       = distributors.filter(d => d.active).length
    parts.push(`=== DISTRIBUTORS (${distributors.length} total | ${active} active) ===`)
    for (const d of distributors) {
      parts.push(`${d.region} | ${d.name} | ${d.city} | ${d.active ? "✓ Active" : "Inactive"}${d.phone ? ` | ${d.phone}` : ""}`)
    }
  }

  // ── Notifications / Alerts ────────────────────────────────────────────────
  if (/notif|alert|warn|urgent|issue|problem/.test(q)) {
    const notifications = await prisma.notification.findMany({
      where:   { read: false },
      orderBy: { createdAt: "desc" },
      take:    20,
    })
    parts.push(`=== UNREAD ALERTS (${notifications.length}) ===`)
    for (const n of notifications) {
      parts.push(`[${n.severity.toUpperCase()}] ${n.title}: ${n.message}`)
    }
  }

  // ── Company overview (admin/owner only) ───────────────────────────────────
  if (/compan|overview|briefing|summary|dashboard|morning|report|how.*doing|status/.test(q) && isPrivileged) {
    const companies  = await prisma.company.findMany({ where: { active: true } })
    const revAgg     = await prisma.order.aggregate({ _sum: { total: true } })
    const orderCount = await prisma.order.count()
    const workerCnt  = await prisma.worker.count({ where: { status: "active" } })
    const unpaidInv  = await prisma.invoice.count({ where: { status: { not: "paid" } } })

    parts.push(`=== BUSINESS OVERVIEW ===`)
    parts.push(`Total revenue (all time): ${Number(revAgg._sum.total ?? 0).toLocaleString()} XAF`)
    parts.push(`Total orders: ${orderCount} | Active workers: ${workerCnt} | Outstanding invoices: ${unpaidInv}`)
    for (const c of companies) {
      parts.push(`Company: ${c.name} — ${c.city}`)
    }
  }

  return parts.length > 0
    ? parts.join("\n")
    : `No specific business data found for this query. Answering from general NMI context.`
}

// ── POST /api/ai/chat ─────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || "unknown"
    if (!checkRateLimit(ip, "default")) {
      return NextResponse.json({ error: "Rate limit exceeded", code: "RATE_LIMIT" }, { status: 429 })
    }

    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { message, history = [] } = await req.json() as {
      message: string
      history: HistoryMsg[]
    }

    if (!message?.trim()) {
      return NextResponse.json({ error: "message is required", code: "VALIDATION" }, { status: 400 })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "AI service not configured", code: "CONFIG_ERROR" }, { status: 503 })
    }

    // Fetch relevant DB context
    const context = await fetchContext(
      message,
      auth.role,
      auth.name,
      auth.companyId ?? undefined,
    )

    const today = new Date().toLocaleDateString("en-GB", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    })

    const systemPrompt = `You are the NMI Intelligence Assistant — an internal AI for NMI Education, a Cameroonian publishing and printing company with offices in Yaoundé and Douala. You have direct access to real-time business data from the company's management system.

The user is a ${auth.role} named ${auth.name}.${auth.companyId ? " They are scoped to their company's data." : " They have full cross-company access."}

RULES:
- Answer in a professional but friendly tone
- Be concise and direct — no padding, no filler
- Use XAF for all currency (e.g. "150,000 XAF")
- Format numbers with commas (e.g. "1,200,000 XAF")
- Never reveal passwords, JWT tokens, or authentication credentials
- If a non-admin/non-owner asks about another specific person's private performance or salary, decline politely
- When data shows a problem (low stock, overdue payments, low performance), flag it clearly
- Today is ${today}

CURRENT BUSINESS DATA (fetched live from the database):
${context}`

    // Keep last 10 exchanges (20 messages) to stay within context limits
    const recentHistory = history.slice(-20)

    const response = await anthropic.messages.create({
      model:      "claude-sonnet-4-6",
      max_tokens: 1024,
      system:     systemPrompt,
      messages: [
        ...recentHistory.map(m => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: message },
      ],
    })

    const reply = response.content[0].type === "text"
      ? response.content[0].text
      : "Unable to generate a response. Please try again."

    return NextResponse.json({ reply, context_used: context.split("\n")[0] })

  } catch (err) {
    console.error("[POST /api/ai/chat]", err)
    return NextResponse.json({ error: "Failed to get AI response", code: "SERVER_ERROR" }, { status: 500 })
  }
}
