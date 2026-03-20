import { NextResponse }   from "next/server"
import { prisma }         from "@/lib/db"
import { requireAuth }    from "@/lib/api-auth"
import { checkRateLimit } from "@/lib/rateLimit"

// ── GET /api/work/sessions ────────────────────────────────────────────────────
// Returns: today's sessions + weekly total + current open session for caller.
// Admin/owner can pass ?workerId=xxx to see another user's sessions.

export async function GET(req: Request) {
  try {
    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || "unknown"
    if (!checkRateLimit(ip, "default")) {
      return NextResponse.json({ error: "Rate limit exceeded", code: "RATE_LIMIT" }, { status: 429 })
    }

    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const url      = new URL(req.url)
    const isPriv   = auth.role === "admin" || auth.role === "owner"
    const targetId = isPriv && url.searchParams.get("workerId")
      ? url.searchParams.get("workerId")!
      : auth.id

    // Today boundaries
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
    const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999)

    // Week start (Monday)
    const weekStart = new Date()
    const day = weekStart.getDay()
    weekStart.setDate(weekStart.getDate() - (day === 0 ? 6 : day - 1))
    weekStart.setHours(0, 0, 0, 0)

    const [todaySessions, weekSessions, openSession] = await Promise.all([
      prisma.workSession.findMany({
        where:   { workerId: targetId, clockIn: { gte: todayStart, lte: todayEnd } },
        orderBy: { clockIn: "desc" },
      }),
      prisma.workSession.findMany({
        where: { workerId: targetId, clockIn: { gte: weekStart }, clockOut: { not: null } },
      }),
      prisma.workSession.findFirst({
        where:   { workerId: targetId, clockOut: null },
        orderBy: { clockIn: "desc" },
      }),
    ])

    const weeklyHours = weekSessions.reduce((s, ws) => s + (ws.hoursTotal ?? 0), 0)
    const todayHours  = todaySessions
      .filter(s => s.clockOut !== null)
      .reduce((s, ws) => s + (ws.hoursTotal ?? 0), 0)

    return NextResponse.json({
      openSession:  openSession ?? null,
      todaySessions,
      todayHours:   Math.round(todayHours  * 100) / 100,
      weeklyHours:  Math.round(weeklyHours * 100) / 100,
    })
  } catch (err) {
    console.error("[GET /api/work/sessions]", err)
    return NextResponse.json({ error: "Internal server error", code: "SERVER_ERROR" }, { status: 500 })
  }
}
