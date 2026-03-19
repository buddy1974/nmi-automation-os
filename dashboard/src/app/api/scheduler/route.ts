import { NextResponse }   from "next/server"
import { runScheduler }   from "@/lib/scheduler"
import { requireAuth }    from "@/lib/api-auth"

// ── GET /api/scheduler — run pending jobs ─────────────────────────────────────
// Trigger manually or via external cron (e.g. Vercel cron, uptime monitor).

export async function GET() {

  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  if (auth.role !== "admin" && auth.role !== "manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const summary = await runScheduler()

  return NextResponse.json({ ok: true, ...summary })
}
