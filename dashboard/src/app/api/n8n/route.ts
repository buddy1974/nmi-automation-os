import { NextResponse } from "next/server"
import { prisma }       from "@/lib/db"

// ── POST /api/n8n ─────────────────────────────────────────────────────────────
// Bridge endpoint for n8n workflows and automation tools.
// Always requires x-n8n-secret header — no fallback to open access.

export async function POST(req: Request) {

  // ── Secret check (always enforced) ──────────────────────────────────────────
  const incoming = req.headers.get("x-n8n-secret")
  const expected = process.env.N8N_SECRET

  if (!expected || !incoming || incoming !== expected) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
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

// ── GET /api/n8n — health check for n8n connection test ───────────────────────

export async function GET(req: Request) {

  const incoming = req.headers.get("x-n8n-secret")
  const expected = process.env.N8N_SECRET

  if (!expected || !incoming || incoming !== expected) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json({ ok: true, service: "NMI Automation OS", bridge: "n8n" })
}
