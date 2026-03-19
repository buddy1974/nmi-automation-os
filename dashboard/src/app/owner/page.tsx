import { cookies }    from "next/headers"
import { redirect }   from "next/navigation"
import { prisma }     from "@/lib/db"
import { getSession } from "@/lib/auth"

export const dynamic = "force-dynamic"

const ALLOWED = ["admin", "hr", "manager", "owner"]

function scoreColor(score: number): string {
  if (score > 400) return "#16a34a"
  if (score > 300) return "#2563eb"
  if (score > 250) return "#d97706"
  return "#dc2626"
}

function ratingColor(rating: string | null): string {
  switch (rating) {
    case "Outstanding":       return "#16a34a"
    case "Excellent":         return "#2563eb"
    case "Very Good":         return "#7c3aed"
    case "Good":              return "#d97706"
    case "Needs Improvement": return "#ea580c"
    default:                  return "#dc2626"
  }
}

function fmt(n: number | null | undefined): string {
  return (n ?? 0).toLocaleString()
}

function Card({
  label, value, sub, color,
}: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div style={{
      background: "white",
      border: "1px solid #e5e7eb",
      borderRadius: "12px",
      padding: "20px 24px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
      borderTop: `4px solid ${color}`,
    }}>
      <div style={{ fontSize: "11px", color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>{label}</div>
      <div style={{ fontSize: "24px", fontWeight: 700, color }}>{value}</div>
      {sub && <div style={{ fontSize: "12px", color: "#999", marginTop: "4px" }}>{sub}</div>}
    </div>
  )
}

export default async function OwnerPage() {

  const jar     = await cookies()
  const session = await getSession(jar.get("nmi_session")?.value)
  if (!session || !ALLOWED.includes(session.role)) redirect("/dashboard")

  const records = await prisma.performanceRecord.findMany({
    include:  { worker: true },
    orderBy:  { totalScore: "desc" },
  })

  // ── Aggregates ──────────────────────────────────────────────────────────────
  const totalBonus          = records.reduce((s, r) => s + (r.bonusAmount     ?? 0), 0)
  const totalSalaryIncrease = records.reduce((s, r) => s + (r.salaryIncrease  ?? 0), 0)
  const totalSuggestedSalary = records.reduce((s, r) => s + (r.suggestedSalary ?? 0), 0)
  const topWorkers          = records.filter(r => r.totalScore > 400)
  const riskWorkers         = records.filter(r => r.totalScore < 250)

  // ── Department roll-up ───────────────────────────────────────────────────────
  const deptMap: Record<string, { count: number; scoreSum: number; bonus: number }> = {}
  for (const r of records) {
    const dept = r.worker.department || "Unassigned"
    if (!deptMap[dept]) deptMap[dept] = { count: 0, scoreSum: 0, bonus: 0 }
    deptMap[dept].count++
    deptMap[dept].scoreSum += r.totalScore
    deptMap[dept].bonus    += r.bonusAmount ?? 0
  }
  const depts = Object.entries(deptMap)
    .map(([name, d]) => ({ name, count: d.count, avg: Math.round(d.scoreSum / d.count), bonus: d.bonus }))
    .sort((a, b) => b.avg - a.avg)

  // ── AI summary ───────────────────────────────────────────────────────────────
  const avgScore = records.length
    ? Math.round(records.reduce((s, r) => s + r.totalScore, 0) / records.length)
    : 0
  const overallLabel = avgScore >= 400 ? "strong" : avgScore >= 300 ? "moderate" : "below expectations"
  const aiSummary = records.length === 0
    ? "No performance data yet. Evaluate workers to generate insights."
    : `Overall performance is ${overallLabel} (avg ${avgScore}/500). ` +
      `Total bonus recommended: ${totalBonus.toLocaleString()} XAF. ` +
      `Workers at risk: ${riskWorkers.length}. ` +
      `Top performers: ${topWorkers.length}.`

  return (
    <div style={{ padding: "32px", fontFamily: "Arial, sans-serif", color: "#111", maxWidth: "1200px" }}>

      {/* Header */}
      <h1 style={{ margin: "0 0 4px", fontSize: "24px" }}>Executive AI Overview</h1>
      <p style={{ margin: "0 0 24px", color: "#666", fontSize: "13px" }}>
        PeopleOS — Performance · Bonus · Salary Intelligence · {records.length} evaluation{records.length !== 1 ? "s" : ""}
      </p>

      {/* AI Summary banner */}
      <div style={{
        background: "#f0fdf4",
        border: "1px solid #86efac",
        borderLeft: "4px solid #16a34a",
        borderRadius: "8px",
        padding: "14px 18px",
        marginBottom: "28px",
        fontSize: "13px",
        color: "#14532d",
        lineHeight: "1.6",
      }}>
        <strong>AI Insight: </strong>{aiSummary}
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "32px" }}>
        <Card label="Total Bonus Suggested"  value={`${totalBonus.toLocaleString()} XAF`}          sub="across all evaluations" color="#16a34a" />
        <Card label="Total Salary Increase"  value={`${totalSalaryIncrease.toLocaleString()} XAF`} sub="recommended increases"   color="#2563eb" />
        <Card label="Top Performers"         value={String(topWorkers.length)}                      sub="score above 400/500"     color="#7c3aed" />
        <Card label="Risk Workers"           value={String(riskWorkers.length)}                     sub="score below 250/500"     color="#dc2626" />
      </div>

      {/* Worker Table */}
      {records.length > 0 ? (
        <>
          <h2 style={{ fontSize: "16px", margin: "0 0 16px" }}>Worker Performance &amp; Compensation</h2>
          <div style={{ overflowX: "auto", marginBottom: "36px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
                  {["Worker", "Dept", "Score", "Rating", "Bonus %", "Bonus (XAF)", "Salary +", "Suggested Salary", "Recommendation"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#555", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => {
                  const col = scoreColor(r.totalScore)
                  return (
                    <tr key={r.id} style={{ borderBottom: "1px solid #f0f0f0", background: i % 2 === 0 ? "white" : "#fafafa" }}>
                      <td style={{ padding: "10px 14px", fontWeight: 600 }}>{r.worker.name}</td>
                      <td style={{ padding: "10px 14px", color: "#666" }}>{r.worker.department || "—"}</td>
                      <td style={{ padding: "10px 14px", fontWeight: 700, color: col }}>{r.totalScore}/500</td>
                      <td style={{ padding: "10px 14px" }}>
                        {r.rating && (
                          <span style={{
                            padding: "2px 8px", borderRadius: "4px", fontSize: "11px",
                            fontWeight: 700, color: "white",
                            background: ratingColor(r.rating),
                          }}>
                            {r.rating}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "10px 14px", color: "#555" }}>
                        {r.bonusPercent != null ? `${((r.bonusPercent) * 100).toFixed(0)}%` : "—"}
                      </td>
                      <td style={{ padding: "10px 14px", fontWeight: 600, color: (r.bonusAmount ?? 0) > 0 ? "#16a34a" : "#111" }}>
                        {r.bonusAmount != null ? fmt(r.bonusAmount) : "—"}
                      </td>
                      <td style={{ padding: "10px 14px", fontWeight: 600, color: (r.salaryIncrease ?? 0) > 0 ? "#2563eb" : "#111" }}>
                        {r.salaryIncrease != null ? `+${fmt(r.salaryIncrease)}` : "—"}
                      </td>
                      <td style={{ padding: "10px 14px", fontWeight: 600, color: "#92400e" }}>
                        {r.suggestedSalary != null ? fmt(r.suggestedSalary) : "—"}
                      </td>
                      <td style={{ padding: "10px 14px", color: col, fontWeight: 600 }}>{r.recommendation ?? "—"}</td>
                    </tr>
                  )
                })}
              </tbody>
              {/* Totals row */}
              <tfoot>
                <tr style={{ borderTop: "2px solid #e5e7eb", background: "#f9fafb", fontWeight: 700 }}>
                  <td style={{ padding: "10px 14px" }} colSpan={5}>TOTAL</td>
                  <td style={{ padding: "10px 14px", color: "#16a34a" }}>{totalBonus.toLocaleString()}</td>
                  <td style={{ padding: "10px 14px", color: "#2563eb" }}>+{totalSalaryIncrease.toLocaleString()}</td>
                  <td style={{ padding: "10px 14px", color: "#92400e" }}>{totalSuggestedSalary.toLocaleString()}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Department roll-up */}
          {depts.length > 0 && (
            <>
              <h2 style={{ fontSize: "16px", margin: "0 0 16px" }}>Department Overview</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
                {depts.map(d => (
                  <div key={d.name} style={{
                    background: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "10px",
                    padding: "16px 20px",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  }}>
                    <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "10px" }}>{d.name}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#555", marginBottom: "4px" }}>
                      <span>Workers evaluated</span><span style={{ fontWeight: 600 }}>{d.count}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#555", marginBottom: "4px" }}>
                      <span>Avg score</span>
                      <span style={{ fontWeight: 600, color: scoreColor(d.avg) }}>{d.avg}/500</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#555" }}>
                      <span>Total bonus</span>
                      <span style={{ fontWeight: 600, color: "#16a34a" }}>{d.bonus.toLocaleString()} XAF</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#aaa", fontSize: "14px" }}>
          No evaluations found. Use the Performance Scorecard to evaluate workers first.
        </div>
      )}

    </div>
  )
}
