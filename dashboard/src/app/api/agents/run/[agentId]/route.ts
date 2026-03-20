import { NextResponse }   from "next/server"
import { prisma }         from "@/lib/db"
import { requireAuth }    from "@/lib/api-auth"
import { checkRateLimit } from "@/lib/rateLimit"
import { getAgent }       from "@/lib/agents"

export const runtime = "nodejs"

// ── POST /api/agents/run/[agentId] ────────────────────────────────────────────

export async function POST(
  req: Request,
  { params }: { params: Promise<{ agentId: string }> },
) {
  try {
    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || "unknown"
    if (!checkRateLimit(ip, "default")) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
    }

    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    if (!["owner", "admin"].includes(auth.role)) {
      return NextResponse.json({ error: "Forbidden — owner/admin only", code: "FORBIDDEN" }, { status: 403 })
    }

    const { agentId } = await params
    const agent = getAgent(agentId)
    if (!agent) {
      return NextResponse.json({ error: `Unknown agent: ${agentId}` }, { status: 404 })
    }

    // Check if enabled
    const config = await prisma.agentConfig.findUnique({ where: { agentId } })
    if (config && !config.enabled) {
      return NextResponse.json({ error: "Agent is disabled" }, { status: 400 })
    }

    const companyId = auth.companyId ?? undefined

    // Create run record
    const run = await prisma.agentRun.create({
      data: { agentId, status: "running", companyId: companyId ?? null },
    })

    try {
      const result = await agent.fn(companyId)

      const endedAt = new Date()
      const updated = await prisma.agentRun.update({
        where: { id: run.id },
        data:  {
          status:  "completed",
          result:  JSON.stringify(result.details),
          actions: result.actions,
          endedAt,
        },
      })

      // Update lastRunAt on config
      await prisma.agentConfig.upsert({
        where:  { agentId },
        update: { lastRunAt: endedAt },
        create: {
          agentId,
          name:        agent.name,
          description: agent.description,
          schedule:    agent.schedule,
          enabled:     true,
          lastRunAt:   endedAt,
        },
      })

      return NextResponse.json({ run: updated, result })

    } catch (agentErr) {
      const errMsg = agentErr instanceof Error ? agentErr.message : String(agentErr)
      await prisma.agentRun.update({
        where: { id: run.id },
        data:  { status: "failed", error: errMsg, endedAt: new Date() },
      })
      console.error(`[Agent ${agentId}]`, agentErr)
      return NextResponse.json({ error: "Agent execution failed", detail: errMsg }, { status: 500 })
    }

  } catch (err) {
    console.error("[POST /api/agents/run]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
