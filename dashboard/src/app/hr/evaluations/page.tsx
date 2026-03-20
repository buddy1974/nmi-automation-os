import Link            from "next/link"
import { cookies }    from "next/headers"
import { redirect }   from "next/navigation"
import { prisma }     from "@/lib/db"
import { getSession } from "@/lib/auth"
import { resolveCompany } from "@/lib/companyFilter"

export const dynamic = "force-dynamic"

const ALLOWED = ["owner", "admin", "manager", "hr"]

function scoreColor(score: number) {
  if (score >= 90) return "#16a34a"
  if (score >= 75) return "#2563eb"
  if (score >= 60) return "#d97706"
  if (score >= 45) return "#ea580c"
  return "#dc2626"
}

function ratingBg(rating: string): { bg: string; color: string } {
  switch (rating) {
    case "Exceptional":       return { bg: "#f0fdf4", color: "#16a34a" }
    case "Strong":            return { bg: "#eff6ff", color: "#2563eb" }
    case "Satisfactory":      return { bg: "#fffbeb", color: "#d97706" }
    case "Needs Improvement": return { bg: "#fff7ed", color: "#ea580c" }
    default:                  return { bg: "#fef2f2", color: "#dc2626" }
  }
}

export default async function EvaluationsPage() {
  const jar     = await cookies()
  const session = await getSession(jar.get("nmi_session")?.value)
  if (!session || !ALLOWED.includes(session.role)) redirect("/dashboard")
  const cid     = resolveCompany(session, jar.get("nmi_company")?.value)

  const evals = await prisma.evaluationSession.findMany({
    where:   cid ? { companyId: cid } : {},
    orderBy: { createdAt: "desc" },
    take:    100,
  })

  const avgScore = evals.length
    ? evals.reduce((s, e) => s + e.totalScore, 0) / evals.length
    : 0

  const ratingCounts = evals.reduce<Record<string, number>>((acc, e) => {
    acc[e.rating] = (acc[e.rating] ?? 0) + 1
    return acc
  }, {})

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111", margin: 0 }}>Evaluation History</h1>
          <p style={{ color: "#6b7280", marginTop: 6, fontSize: 14 }}>{evals.length} evaluations on record</p>
        </div>
        <Link
          href="/hr/evaluate"
          style={{ background: "#1a1a2e", color: "#fff", padding: "10px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none" }}
        >
          + New Evaluation
        </Link>
      </div>

      {/* KPI strip */}
      {evals.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
          <KpiCard label="Avg Score"   value={`${avgScore.toFixed(1)}`} sub="across all evaluations" color={scoreColor(avgScore)} />
          <KpiCard label="Total Evals" value={String(evals.length)}     sub="evaluation sessions" color="#6b7280" />
          <KpiCard label="Top Rating"  value={Object.entries(ratingCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—"} sub="most common rating" color="#2563eb" />
        </div>
      )}

      {/* Table */}
      {evals.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af" }}>
          No evaluations yet.{" "}
          <Link href="/hr/evaluate" style={{ color: "#2563eb" }}>Run first evaluation →</Link>
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                {["Employee", "Period", "Type", "Scrum", "Task", "Score", "Rating", "AI Summary", "Date"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {evals.map((ev, i) => {
                const rb = ratingBg(ev.rating)
                const scrumAvg = ((ev.commitment + ev.courage + ev.focus + ev.openness + ev.respect) / 5 * 10).toFixed(0)
                const taskAvg  = ((ev.taskCompletion + ev.deadlineScore + ev.qualityScore) / 3 * 10).toFixed(0)
                return (
                  <tr key={ev.id} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ padding: "12px 14px", fontWeight: 600, fontSize: 14 }}>{ev.workerName}</td>
                    <td style={{ padding: "12px 14px", fontSize: 13, color: "#374151" }}>{ev.period}</td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: "#6b7280", textTransform: "capitalize" }}>{ev.type}</td>
                    <td style={{ padding: "12px 14px", fontSize: 14, fontWeight: 600, color: "#7c3aed" }}>{scrumAvg}</td>
                    <td style={{ padding: "12px 14px", fontSize: 14, fontWeight: 600, color: "#2563eb" }}>{taskAvg}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: scoreColor(ev.totalScore) }}>{ev.totalScore.toFixed(1)}</span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ background: rb.bg, color: rb.color, padding: "3px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                        {ev.rating}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px", maxWidth: 260 }}>
                      <div style={{ fontSize: 12, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {ev.aiSummary ?? "—"}
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: "#9ca3af", whiteSpace: "nowrap" }}>
                      {new Date(ev.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "16px 20px" }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", marginBottom: 4 }}>{label.toUpperCase()}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{sub}</div>
    </div>
  )
}
