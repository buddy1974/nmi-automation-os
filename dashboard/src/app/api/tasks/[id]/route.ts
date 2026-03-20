import { NextResponse }   from "next/server"
import { prisma }         from "@/lib/db"
import { requireAuth }    from "@/lib/api-auth"
import { checkRateLimit } from "@/lib/rateLimit"
import { sanitizeString } from "@/lib/validate"

const VALID_STATUS   = ["todo", "in_progress", "done"]
const VALID_PRIORITY = ["low", "medium", "high", "urgent"]

// ── PATCH /api/tasks/[id] ─────────────────────────────────────────────────────

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

    const task = await prisma.task.findUnique({ where: { id } })
    if (!task) {
      return NextResponse.json({ error: "Task not found", code: "NOT_FOUND" }, { status: 404 })
    }

    const data: Record<string, unknown> = await req.json()
    const update: Record<string, unknown> = {}

    if (data.status !== undefined) {
      if (!VALID_STATUS.includes(data.status as string)) {
        return NextResponse.json({ error: `status must be one of: ${VALID_STATUS.join(", ")}`, code: "VALIDATION" }, { status: 400 })
      }
      update.status = data.status
      // Auto-stamp actual hours when marking done
      if (data.status === "done" && !task.actualH && task.estimatedH) {
        update.actualH = task.estimatedH
      }
    }

    if (data.actualH   !== undefined) update.actualH   = Number(data.actualH)
    if (data.ownerId   !== undefined) update.ownerId   = data.ownerId
    if (data.ownerName !== undefined) update.ownerName = sanitizeString(data.ownerName as string)
    if (data.priority  !== undefined && VALID_PRIORITY.includes(data.priority as string)) {
      update.priority = data.priority
    }

    const updated = await prisma.task.update({ where: { id }, data: update })
    return NextResponse.json(updated)

  } catch (err) {
    console.error("[PATCH /api/tasks/[id]]", err)
    return NextResponse.json({ error: "Internal server error", code: "SERVER_ERROR" }, { status: 500 })
  }
}

// ── DELETE /api/tasks/[id] ────────────────────────────────────────────────────

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    if (auth.role !== "admin" && auth.role !== "owner" && auth.role !== "manager") {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 })
    }

    const { id } = await params
    await prisma.task.delete({ where: { id } })
    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error("[DELETE /api/tasks/[id]]", err)
    return NextResponse.json({ error: "Internal server error", code: "SERVER_ERROR" }, { status: 500 })
  }
}
