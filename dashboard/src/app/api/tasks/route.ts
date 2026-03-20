import { NextResponse }   from "next/server"
import { prisma }         from "@/lib/db"
import { requireAuth }    from "@/lib/api-auth"
import { checkRateLimit } from "@/lib/rateLimit"
import { validateRequired, sanitizeString } from "@/lib/validate"

function getIp(req: Request) {
  return (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || "unknown"
}

const VALID_STATUS   = ["todo", "in_progress", "done"]
const VALID_PRIORITY = ["low", "medium", "high", "urgent"]

// ── GET /api/tasks ────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  try {
    const ip = getIp(req)
    if (!checkRateLimit(ip, "default")) {
      return NextResponse.json({ error: "Rate limit exceeded", code: "RATE_LIMIT" }, { status: 429 })
    }

    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const url      = new URL(req.url)
    const status   = url.searchParams.get("status")
    const isPriv   = auth.role === "admin" || auth.role === "owner"

    const where: Record<string, unknown> = {}
    if (!isPriv && auth.companyId)  where.companyId = auth.companyId
    if (status && VALID_STATUS.includes(status)) where.status = status

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    })

    return NextResponse.json(tasks)
  } catch (err) {
    console.error("[GET /api/tasks]", err)
    return NextResponse.json({ error: "Internal server error", code: "SERVER_ERROR" }, { status: 500 })
  }
}

// ── POST /api/tasks ───────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const ip = getIp(req)
    if (!checkRateLimit(ip, "default")) {
      return NextResponse.json({ error: "Rate limit exceeded", code: "RATE_LIMIT" }, { status: 429 })
    }

    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const data = await req.json()

    const titleErr = validateRequired(data.title, "title")
    if (titleErr) return NextResponse.json({ error: titleErr, code: "VALIDATION" }, { status: 400 })

    if (data.priority && !VALID_PRIORITY.includes(data.priority)) {
      return NextResponse.json({ error: `priority must be one of: ${VALID_PRIORITY.join(", ")}`, code: "VALIDATION" }, { status: 400 })
    }

    const task = await prisma.task.create({
      data: {
        title:       sanitizeString(data.title),
        description: data.description ? sanitizeString(data.description) : null,
        priority:    VALID_PRIORITY.includes(data.priority) ? data.priority : "medium",
        department:  data.department ? sanitizeString(data.department) : null,
        ownerId:     data.ownerId   ?? auth.id,
        ownerName:   data.ownerName ? sanitizeString(data.ownerName) : auth.name,
        estimatedH:  data.estimatedH ? Number(data.estimatedH) : null,
        dueDate:     data.dueDate   ? new Date(data.dueDate)   : null,
        companyId:   auth.companyId ?? null,
        status:      "todo",
      },
    })

    return NextResponse.json(task, { status: 201 })
  } catch (err) {
    console.error("[POST /api/tasks]", err)
    return NextResponse.json({ error: "Internal server error", code: "SERVER_ERROR" }, { status: 500 })
  }
}
