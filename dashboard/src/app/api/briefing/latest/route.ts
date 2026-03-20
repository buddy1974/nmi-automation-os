import { NextResponse }   from "next/server"
import { prisma }         from "@/lib/db"
import { requireAuth }    from "@/lib/api-auth"
import { checkRateLimit } from "@/lib/rateLimit"

export const runtime = "nodejs"

// ── GET /api/briefing/latest ──────────────────────────────────────────────────

export async function GET(req: Request) {
  try {
    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || "unknown"
    if (!checkRateLimit(ip, "default")) {
      return NextResponse.json({ error: "Rate limit exceeded", code: "RATE_LIMIT" }, { status: 429 })
    }

    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const isPriv = auth.role === "admin" || auth.role === "owner"
    const where: Record<string, unknown> = { type: "daily_briefing" }
    if (!isPriv && auth.companyId) where.companyId = auth.companyId

    // Latest briefing
    const latest = await prisma.notification.findFirst({
      where,
      orderBy: { createdAt: "desc" },
    })

    // Last 7 briefings for history
    const history = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 7,
      select: { id: true, title: true, createdAt: true, message: true },
    })

    return NextResponse.json({
      latest:  latest  ? { ...latest,  createdAt: latest.createdAt.toISOString()  } : null,
      history: history.map(h => ({ ...h, createdAt: h.createdAt.toISOString() })),
    })

  } catch (err) {
    console.error("[GET /api/briefing/latest]", err)
    return NextResponse.json({ error: "Internal server error", code: "SERVER_ERROR" }, { status: 500 })
  }
}
