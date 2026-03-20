import { cookies }    from "next/headers"
import { redirect }   from "next/navigation"
import { prisma }     from "@/lib/db"
import { getSession } from "@/lib/auth"
import { S, row }     from "@/lib/ui"
import AgentRunner    from "@/app/components/AgentRunner"
import AgentToggle    from "./AgentToggle"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "AI Agents — NMI Automation OS" }

const ALLOWED = ["owner", "admin"]

function durationLabel(startedAt: Date | string, endedAt: Date | string | null): string {
  if (!endedAt) return "—"
  const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime()
  if (ms < 1000)  return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
}

function timeAgo(iso: string | null): string {
  if (!iso) return "Never"
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (secs < 60)    return "Just now"
  if (secs < 3600)  return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}

function statusDot(status: string) {
  const map: Record<string, [string, string]> = {
    completed: ["#dcfce7", "#16a34a"],
    running:   ["#dbeafe", "#2563eb"],
    failed:    ["#fee2e2", "#dc2626"],
  }
  const [bg, color] = map[status] ?? ["#f1f5f9", "#64748b"]
  return (
    <span style={{ background: bg, color, borderRadius: "999px", padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
      {status}
    </span>
  )
}

export default async function AgentsPage() {
  const jar     = await cookies()
  const session = await getSession(jar.get("nmi_session")?.value)
  if (!session || !ALLOWED.includes(session.role)) redirect("/dashboard")

  // Ensure all configs exist
  const { AGENTS } = await import("@/lib/agents")
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

  const configs = await prisma.agentConfig.findMany({ orderBy: { createdAt: "asc" } })

  const agentsWithRuns = await Promise.all(
    configs.map(async c => {
      const lastRun = await prisma.agentRun.findFirst({
        where:   { agentId: c.agentId },
        orderBy: { startedAt: "desc" },
      })
      return { config: c, lastRun }
    })
  )

  // Stats
  const todayStart = new Date(); todayStart.setHours(0,0,0,0)
  const [runsToday, actionsToday] = await Promise.all([
    prisma.agentRun.count({ where: { startedAt: { gte: todayStart } } }),
    prisma.agentRun.aggregate({ _sum: { actions: true }, where: { startedAt: { gte: todayStart } } }),
  ])

  const enabledCount  = configs.filter(c => c.enabled).length
  const recentRuns    = await prisma.agentRun.findMany({
    orderBy: { startedAt: "desc" },
    take:    20,
  })

  return (
    <div style={S.page}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ ...S.heading, margin: 0 }}>AI Agent Command Center</h1>
        <p style={{ ...S.subtitle, margin: "4px 0 0" }}>
          8 autonomous agents monitoring and acting on your business data
        </p>
      </div>

      {/* Stats bar */}
      <div style={S.statBar}>
        <div style={S.statCard}><div style={S.statValue}>{configs.length}</div><div style={S.statLabel}>Total Agents</div></div>
        <div style={S.statCard}><div style={{ ...S.statValue, color: "#16a34a" }}>{enabledCount}</div><div style={S.statLabel}>Active</div></div>
        <div style={S.statCard}><div style={{ ...S.statValue, color: "#7c3aed" }}>{runsToday}</div><div style={S.statLabel}>Runs Today</div></div>
        <div style={S.statCard}><div style={{ ...S.statValue, color: "#f97316" }}>{actionsToday._sum.actions ?? 0}</div><div style={S.statLabel}>Actions Today</div></div>
      </div>

      {/* Agent cards */}
      <h2 style={S.sectionTitle}>Agents ({configs.length})</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))", gap: 16, marginBottom: 40 }}>
        {agentsWithRuns.map(({ config: c, lastRun }) => (
          <div key={c.id} style={{
            background:   "#fff",
            border:       "1px solid #e2e8f0",
            borderRadius: 10,
            padding:      20,
            display:      "flex",
            flexDirection:"column",
            gap:          12,
          }}>
            {/* Card header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a2e" }}>{c.name}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>{c.description}</div>
              </div>
              <AgentToggle agentId={c.agentId} enabled={c.enabled} />
            </div>

            {/* Schedule + last run */}
            <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
              <div style={{ color: "#64748b" }}>
                <span style={{ color: "#94a3b8", marginRight: 4 }}>Schedule:</span>
                {c.schedule ?? "Manual"}
              </div>
              <div style={{ color: "#64748b" }}>
                <span style={{ color: "#94a3b8", marginRight: 4 }}>Last run:</span>
                {timeAgo(c.lastRunAt?.toISOString() ?? null)}
              </div>
            </div>

            {/* Last result */}
            {lastRun && (
              <div style={{
                background:   lastRun.status === "completed" ? "#f0fdf4" : lastRun.status === "failed" ? "#fef2f2" : "#f0f9ff",
                borderRadius: 6,
                padding:      "8px 12px",
                fontSize:     12,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  {statusDot(lastRun.status)}
                  <span style={{ color: "#94a3b8" }}>{timeAgo(lastRun.startedAt.toISOString())}</span>
                </div>
                {lastRun.result && (
                  <div style={{ color: "#374151", marginTop: 4 }}>
                    {(() => {
                      try {
                        const r = JSON.parse(lastRun.result) as Record<string, unknown>
                        return Object.entries(r)
                          .filter(([k]) => !k.startsWith("monthly"))
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(" · ")
                      } catch { return lastRun.result?.slice(0, 100) }
                    })()}
                  </div>
                )}
                {lastRun.error && (
                  <div style={{ color: "#dc2626", marginTop: 4 }}>{lastRun.error.slice(0, 100)}</div>
                )}
              </div>
            )}

            {/* Run button */}
            <AgentRunner agentId={c.agentId} agentName={c.name} />
          </div>
        ))}
      </div>

      {/* Recent runs table */}
      <h2 style={S.sectionTitle}>Recent Runs ({recentRuns.length})</h2>
      {recentRuns.length === 0 ? (
        <p style={S.mutedText}>No runs yet. Click "▶ Run Now" on any agent to start.</p>
      ) : (
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>
                {["Agent", "Status", "Actions", "Duration", "Time"].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentRuns.map((r, i) => (
                <tr key={r.id} style={row(i)}>
                  <td style={{ ...S.td, fontWeight: 600, color: "#2563eb" }}>
                    {r.agentId.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                  </td>
                  <td style={S.td}>{statusDot(r.status)}</td>
                  <td style={S.td}>
                    <span style={{
                      background:   "#f1f5f9",
                      color:        "#475569",
                      borderRadius: "999px",
                      padding:      "2px 10px",
                      fontSize:     12,
                      fontWeight:   600,
                    }}>
                      {r.actions}
                    </span>
                  </td>
                  <td style={{ ...S.td, color: "#64748b" }}>
                    {durationLabel(r.startedAt, r.endedAt)}
                  </td>
                  <td style={{ ...S.td, color: "#64748b" }}>
                    {timeAgo(r.startedAt.toISOString())}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
