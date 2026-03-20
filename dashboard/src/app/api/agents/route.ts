import { NextResponse }   from "next/server"
import { prisma }         from "@/lib/db"
import { requireAuth }    from "@/lib/api-auth"
import { checkRateLimit } from "@/lib/rateLimit"
import { AGENTS }         from "@/lib/agents"

export const runtime = "nodejs"

// ── GET /api/agents ───────────────────────────────────────────────────────────

export async function GET(req: Request) {
  try {
    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || "unknown"
    if (!checkRateLimit(ip, "default")) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
    }

    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    // Ensure default configs exist
    for (const agent of AGENTS) {
      await prisma.agentConfig.upsert({
        where:  { agentId: agent.id },
        update: {},
        create: {
          agentId:     agent.id,
          name:        agent.name,
          description: agent.description,
          schedule:    agent.schedule,
          enabled:     true,
        },
      })
    }

    const configs = await prisma.agentConfig.findMany({
      orderBy: { createdAt: "asc" },
    })

    // Attach last run for each agent
    const withRuns = await Promise.all(
      configs.map(async c => {
        const lastRun = await prisma.agentRun.findFirst({
          where:   { agentId: c.agentId },
          orderBy: { startedAt: "desc" },
        })
        return {
          ...c,
          lastRunAt: c.lastRunAt?.toISOString() ?? null,
          createdAt: c.createdAt.toISOString(),
          lastRun:   lastRun ? {
            ...lastRun,
            startedAt: lastRun.startedAt.toISOString(),
            endedAt:   lastRun.endedAt?.toISOString() ?? null,
          } : null,
        }
      })
    )

    return NextResponse.json({ agents: withRuns })

  } catch (err) {
    console.error("[GET /api/agents]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ── PATCH /api/agents — toggle enabled ───────────────────────────────────────

export async function PATCH(req: Request) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    if (!["owner", "admin"].includes(auth.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { agentId, enabled } = await req.json() as { agentId: string; enabled: boolean }

    const updated = await prisma.agentConfig.update({
      where: { agentId },
      data:  { enabled },
    })

    return NextResponse.json({ agent: { ...updated, lastRunAt: updated.lastRunAt?.toISOString() ?? null } })

  } catch (err) {
    console.error("[PATCH /api/agents]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
