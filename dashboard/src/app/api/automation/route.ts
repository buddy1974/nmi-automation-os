import { NextResponse } from "next/server"
import { prisma }       from "@/lib/db"
import { requireAuth }  from "@/lib/api-auth"

// ── GET /api/automation ───────────────────────────────────────────────────────

export async function GET() {

  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  if (auth.role !== "admin" && auth.role !== "manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const jobs = await prisma.automationJob.findMany({
    orderBy: { id: "desc" },
  })

  return NextResponse.json(jobs)
}

// ── POST /api/automation ──────────────────────────────────────────────────────

export async function POST(req: Request) {

  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  if (auth.role !== "admin" && auth.role !== "manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const data = await req.json()

  if (!data.type) {
    return NextResponse.json({ error: "type is required" }, { status: 400 })
  }

  const job = await prisma.automationJob.create({
    data: {
      type:    data.type,
      payload: data.payload ?? {},
      status:  "pending",
    },
  })

  return NextResponse.json(job, { status: 201 })
}
