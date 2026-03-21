import { NextRequest, NextResponse } from "next/server"
import { requireAuth }               from "@/lib/api-auth"
import { prisma }                    from "@/lib/db"
import { hashPassword }              from "@/lib/auth"
import Anthropic                     from "@anthropic-ai/sdk"

const ALLOWED = ["owner", "admin"]

// POST /api/setup — multipurpose setup actions
export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  if (!ALLOWED.includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { action, ...data } = await req.json() as { action: string; [k: string]: unknown }

  switch (action) {

    case "create_company": {
      const { name, city } = data as { name: string; city: string }
      if (!name?.trim()) return NextResponse.json({ error: "Company name required" }, { status: 400 })
      const company = await prisma.company.create({ data: { name: name.trim(), city: city?.trim() ?? "" } })
      return NextResponse.json({ company })
    }

    case "create_admin": {
      const { name, email, password } = data as { name: string; email: string; password: string }
      if (!name || !email || !password) return NextResponse.json({ error: "All fields required" }, { status: 400 })
      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 400 })
      const hashed = await hashPassword(password)
      const user   = await prisma.user.create({ data: { name, email, password: hashed, role: "admin", active: true } })
      return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } })
    }

    case "test_ai": {
      try {
        const ai  = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
        const msg = await ai.messages.create({
          model: "claude-haiku-4-5-20251001", max_tokens: 10,
          messages: [{ role: "user", content: "ping" }],
        })
        const ok = msg.content.length > 0
        return NextResponse.json({ ok, model: "claude-haiku-4-5-20251001" })
      } catch (err) {
        return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "AI check failed" })
      }
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  }
}

// GET /api/setup — system health snapshot
export async function GET() {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  if (!ALLOWED.includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const [
    companyCount, userCount, workerCount,
    productCount, customerCount, authorCount,
    googleToken,
  ] = await Promise.all([
    prisma.company.count(),
    prisma.user.count(),
    prisma.worker.count(),
    prisma.product.count(),
    prisma.customer.count(),
    prisma.author.count(),
    prisma.googleToken.findFirst({ where: { userId: auth.id } }),
  ])

  const whatsappConfigured = !!(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_ID)
  const aiConfigured       = !!process.env.ANTHROPIC_API_KEY

  return NextResponse.json({
    companies:  companyCount,
    users:      userCount,
    workers:    workerCount,
    products:   productCount,
    customers:  customerCount,
    authors:    authorCount,
    googleConnected:    !!googleToken,
    whatsappConfigured,
    aiConfigured,
  })
}
