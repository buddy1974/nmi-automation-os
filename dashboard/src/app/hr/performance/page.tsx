import { cookies }    from "next/headers"
import { redirect }   from "next/navigation"
import { prisma }     from "@/lib/db"
import { getSession } from "@/lib/auth"
import EvalForm       from "./EvalForm"

export const dynamic = "force-dynamic"

const ALLOWED = ["admin", "hr", "manager"]

function scoreColor(score: number): string {
  if (score >= 80) return "#16a34a"
  if (score >= 60) return "#d97706"
  return "#dc2626"
}

function scoreLabel(score: number): string {
  if (score >= 80) return "Excellent"
  if (score >= 60) return "Good"
  if (score >= 40) return "Average"
  return "Low"
}

export default async function PerformancePage() {

  // ── Role guard ───────────────────────────────────────────────────────────────
  const jar     = await cookies()
  const session = await getSession(jar.get("nmi_session")?.value)
  if (!session || !ALLOWED.includes(session.role)) redirect("/dashboard")

  // ── Data ─────────────────────────────────────────────────────────────────────
  const [workers, records] = await Promise.all([
    prisma.worker.findMany({ where: { status: "active" }, orderBy: { name: "asc" } }),
    prisma.performanceRecord.findMany({
      include: { worker: { select: { name: true, role: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ])

  return (
    <div style={{ padding: "32px", fontFamily: "Arial, sans-serif", color: "#111" }}>

      <h1 style={{ margin: "0 0 4px", fontSize: "24px" }}>Performance evaluations</h1>
      <p style={{ margin: "0 0 32px", color: "#666", fontSize: "13px" }}>
        PeopleOS — KPI scoring, manager notes, AI analysis (17.3)
      </p>

      {/* Evaluation form */}
      <EvalForm workers={workers.map(w => ({ id: w.id, name: w.name, role: w.role }))} />

      {/* Records table */}
      <h2 style={{ fontSize: "16px", margin: "0 0 16px" }}>
        All evaluations ({records.length})
      </h2>

      {records.length === 0 ? (
        <p style={{ color: "#aaa" }}>No evaluations yet. Add one above.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr>
                {["Worker", "Period", "Attend.", "Prod.", "Quality", "Teamwork", "Discipline", "Total", "Note", "Date"].map(h => (
                  <th key={h} style={{
                    background: "#1a1a2e", color: "white",
                    padding: "10px 10px", textAlign: "left",
                    fontSize: "11px", textTransform: "uppercase",
                    letterSpacing: "0.5px", whiteSpace: "nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id}>
                  <td style={td}>
                    <div style={{ fontWeight: 600 }}>{r.worker.name}</div>
                    <div style={{ fontSize: "11px", color: "#888" }}>{r.worker.role}</div>
                  </td>
                  <td style={td}>{r.period}</td>
                  {[r.attendance, r.productivity, r.quality, r.teamwork, r.discipline].map((v, i) => (
                    <td key={i} style={{ ...td, color: scoreColor(v), fontWeight: 600 }}>{v}</td>
                  ))}
                  <td style={td}>
                    <span style={{
                      padding: "2px 8px", borderRadius: "4px", fontSize: "11px",
                      fontWeight: 700, color: "white",
                      background: scoreColor(r.totalScore),
                    }}>
                      {r.totalScore.toFixed(1)} — {scoreLabel(r.totalScore)}
                    </span>
                  </td>
                  <td style={{ ...td, maxWidth: "180px", color: "#555" }}>
                    {r.managerNote
                      ? <span title={r.managerNote}>{r.managerNote.slice(0, 40)}{r.managerNote.length > 40 ? "…" : ""}</span>
                      : <span style={{ color: "#ccc" }}>—</span>
                    }
                  </td>
                  <td style={{ ...td, whiteSpace: "nowrap", color: "#888" }}>
                    {new Date(r.createdAt).toLocaleDateString("fr-CM", { day: "2-digit", month: "short", year: "numeric" })}
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

const td: React.CSSProperties = {
  padding: "10px 10px",
  borderBottom: "1px solid #eee",
  verticalAlign: "middle",
}
