import { cookies }    from "next/headers"
import { redirect }   from "next/navigation"
import { prisma }     from "@/lib/db"
import { getSession } from "@/lib/auth"
import { headers }    from "next/headers"
import WorkflowTester from "./WorkflowTester"

export const dynamic = "force-dynamic"

import type { Metadata } from "next"
export const metadata: Metadata = { title: "Automation — NMI Automation OS" }

const ALLOWED = ["owner", "admin"]

const WORKFLOW_DEFS = [
  { name: "email_classify", trigger: "Webhook / Gmail",   desc: "Classify and route incoming emails via AI" },
  { name: "stock_alert",    trigger: "Hourly cron",        desc: "Scan stock levels and create low-stock notifications" },
  { name: "royalty_check",  trigger: "Daily cron",         desc: "Find unpaid royalties older than 30 days" },
  { name: "daily_briefing", trigger: "Daily 08:00",        desc: "Aggregate KPIs and send CEO morning summary" },
  { name: "task_reminder",  trigger: "Daily 09:00",        desc: "Flag overdue tasks and notify owners" },
]

function maskSecret(s: string) {
  return s.slice(0, 4) + "•".repeat(Math.min(s.length - 4, 20))
}

function typeBadge(type: string) {
  const known: Record<string, { bg: string; color: string; label: string }> = {
    n8n_email_classify: { bg: "#eff6ff", color: "#2563eb",  label: "email_classify"  },
    n8n_daily_briefing: { bg: "#f0fdf4", color: "#16a34a",  label: "daily_briefing"  },
    low_stock_alert:    { bg: "#fff7ed", color: "#ea580c",  label: "stock_alert"     },
    royalty_reminder:   { bg: "#fdf4ff", color: "#9333ea",  label: "royalty_check"   },
    task_reminder:      { bg: "#fffbeb", color: "#d97706",  label: "task_reminder"   },
  }
  const s = known[type] ?? { bg: "#f3f4f6", color: "#6b7280", label: type }
  return <span style={{ background: s.bg, color: s.color, padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 700 }}>{s.label}</span>
}

export default async function N8nPage() {
  const jar     = await cookies()
  const session = await getSession(jar.get("nmi_session")?.value)
  if (!session || !ALLOWED.includes(session.role)) redirect("/dashboard")
  const hdrs    = await headers()

  const host       = hdrs.get("host") ?? "localhost:3000"
  const proto      = host.startsWith("localhost") ? "http" : "https"
  const baseUrl    = `${proto}://${host}`
  const secret     = process.env.NMI_WEBHOOK_SECRET ?? ""
  const maskedSec  = secret ? maskSecret(secret) : "(not set)"

  // Recent workflow-related notifications
  const recentRuns = await prisma.notification.findMany({
    where: {
      type: {
        in: ["n8n_email_classify", "n8n_daily_briefing", "low_stock_alert", "royalty_reminder", "task_reminder"],
      },
    },
    orderBy: { createdAt: "desc" },
    take:    20,
  })

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111", margin: 0 }}>Automation Workflows</h1>
        <p style={{ color: "#6b7280", marginTop: 6, fontSize: 14 }}>
          n8n integration layer — connect external triggers to NMI workflows
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Section 1 — Connection status */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#111", marginBottom: 16 }}>Connection Config</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <ConfigRow label="Trigger endpoint" value={`${baseUrl}/api/n8n/trigger`} mono />
              <ConfigRow label="Health endpoint"  value={`${baseUrl}/api/n8n/status`}  mono />
              <ConfigRow label="Webhook secret"   value={maskedSec} mono />
              <ConfigRow label="Auth header"       value="x-nmi-webhook-secret" mono />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#6b7280" }}>Status</span>
                <span style={{ background: "#f0fdf4", color: "#16a34a", padding: "3px 12px", borderRadius: 12, fontSize: 12, fontWeight: 700 }}>
                  ● Active
                </span>
              </div>
            </div>
          </div>

          {/* Section 2 — Workflows table */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", fontWeight: 700, fontSize: 15, color: "#111", borderBottom: "1px solid #f3f4f6" }}>
              Available Workflows
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                  {["Workflow", "Trigger", "Description"].map(h => (
                    <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {WORKFLOW_DEFS.map((wf, i) => (
                  <tr key={wf.name} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ padding: "10px 14px" }}>
                      <code style={{ fontSize: 12, background: "#f3f4f6", color: "#1a1a2e", padding: "2px 6px", borderRadius: 4 }}>{wf.name}</code>
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>{wf.trigger}</td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: "#374151" }}>{wf.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section 3 — Recent runs */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", fontWeight: 700, fontSize: 15, color: "#111", borderBottom: "1px solid #f3f4f6" }}>
              Recent Workflow Runs ({recentRuns.length})
            </div>
            {recentRuns.length === 0 ? (
              <div style={{ padding: "32px 20px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                No workflow runs yet — use the tester →
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f9fafb" }}>
                    {["Workflow", "Summary", "Date"].map(h => (
                      <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentRuns.map((n, i) => (
                    <tr key={n.id} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={{ padding: "10px 14px" }}>{typeBadge(n.type)}</td>
                      <td style={{ padding: "10px 14px", fontSize: 12, color: "#374151", maxWidth: 300 }}>
                        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.message}</div>
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap" }}>
                        {n.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Section 4 — Quick test */}
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#111", marginBottom: 14 }}>Quick Test</div>
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16, marginTop: 0 }}>
            Run any workflow directly from here. Results appear inline and are saved to the notifications log.
          </p>
          <WorkflowTester secret={secret} />
        </div>
      </div>
    </div>
  )
}

function ConfigRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", whiteSpace: "nowrap" }}>{label}</span>
      <span style={{
        fontSize: 11,
        fontFamily: mono ? "monospace" : "inherit",
        color: "#374151",
        background: "#f9fafb",
        padding: "3px 8px",
        borderRadius: 4,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        maxWidth: 360,
        display: "block",
      }}>{value}</span>
    </div>
  )
}
