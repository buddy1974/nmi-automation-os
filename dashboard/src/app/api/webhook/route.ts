import { NextResponse } from "next/server"
import { prisma }       from "@/lib/db"

// ── POST /api/webhook ─────────────────────────────────────────────────────────
// No session cookie — intended for external callers (n8n, scripts, etc.)
// Protected by optional x-webhook-secret header when WEBHOOK_SECRET is set.

export async function POST(req: Request) {

  // ── Secret check ────────────────────────────────────────────────────────────
  const expectedSecret = process.env.WEBHOOK_SECRET
  if (expectedSecret) {
    const incoming = req.headers.get("x-webhook-secret")
    if (!incoming || incoming !== expectedSecret) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  // ── Parse body ───────────────────────────────────────────────────────────────
  let data: { type?: string; payload?: unknown }
  try {
    data = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  if (!data.type) {
    return NextResponse.json({ error: "type is required" }, { status: 400 })
  }

  // ── Create automation job ────────────────────────────────────────────────────
  const job = await prisma.automationJob.create({
    data: {
      type:    data.type,
      payload: (data.payload ?? {}) as object,
      status:  "pending",
    },
  })

  return NextResponse.json({ ok: true, jobId: job.id }, { status: 201 })
}
