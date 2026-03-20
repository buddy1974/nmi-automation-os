import { NextResponse }   from "next/server"
import { prisma }         from "@/lib/db"
import { requireAuth }    from "@/lib/api-auth"
import { checkRateLimit } from "@/lib/rateLimit"

export const runtime = "nodejs"

// ── PATCH /api/email/[id] — mark handled ──────────────────────────────────────

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || "unknown"
    if (!checkRateLimit(ip, "default")) {
      return NextResponse.json({ error: "Rate limit exceeded", code: "RATE_LIMIT" }, { status: 429 })
    }

    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { id } = await params

    const log = await prisma.emailLog.findUnique({ where: { id } })
    if (!log) {
      return NextResponse.json({ error: "Email log not found", code: "NOT_FOUND" }, { status: 404 })
    }

    const updated = await prisma.emailLog.update({
      where: { id },
      data:  { handled: true },
    })

    return NextResponse.json(updated)

  } catch (err) {
    console.error("[PATCH /api/email/[id]]", err)
    return NextResponse.json({ error: "Internal server error", code: "SERVER_ERROR" }, { status: 500 })
  }
}
