import { cookies }    from "next/headers"
import { redirect }   from "next/navigation"
import { prisma }     from "@/lib/db"
import { getSession } from "@/lib/auth"
import { resolveCompany, perfFilter } from "@/lib/companyFilter"

export const dynamic = "force-dynamic"

const ALLOWED = ["admin", "owner", "manager", "hr"]

function scoreColor(avg: number): string {
  if (avg > 400) return "#16a34a"
  if (avg > 300) return "#2563eb"
  if (avg > 250) return "#d97706"
  return "#dc2626"
}

function scoreBg(avg: number): string {
  if (avg > 400) return "#f0fdf4"
  if (avg > 300) return "#eff6ff"
  if (avg > 250) return "#fffbeb"
  return "#fef2f2"
}

function fmt(n: number): string {
  return n.toLocaleString()
}

interface GroupStats {
  name:              string
  count:             number
  scoreSum:          number
  totalBonus:        number
  totalIncrease:     number
  topCount:          number
  riskCount:         number
}

function groupRecords(
  records: Array<{
    totalScore: number
    bonusAmount: number | null
    salaryIncrease: number | null
    worker: { department: string; role: string }
  }>,
  key: "department" | "role",
): GroupStats[] {
  const map: Record<string, GroupStats> = {}

  for (const r of records) {
    const name = (key === "department" ? r.worker.department : r.worker.role) || "Unassigned"
    if (!map[name]) map[name] = { name, count: 0, scoreSum: 0, totalBonus: 0, totalIncrease: 0, topCount: 0, riskCount: 0 }
    map[name].count++
    map[name].scoreSum      += r.totalScore
    map[name].totalBonus    += r.bonusAmount    ?? 0
    map[name].totalIncrease += r.salaryIncrease ?? 0
    if (r.totalScore > 400) map[name].topCount++
    if (r.totalScore < 250) map[name].riskCount++
  }

  return Object.values(map)
    .map(g => ({ ...g, avg: g.count > 0 ? Math.round(g.scoreSum / g.count) : 0 }))
    .sort((a, b) => (b as GroupStats & { avg: number }).avg - (a as GroupStats & { avg: number }).avg) as (GroupStats & { avg: number })[]
}

function AnalyticsTable({
  rows, label,
}: {
  rows: (GroupStats & { avg: number })[]
  label: string
}) {
  if (rows.length === 0) return null
  return (
    <div style={{ marginBottom: "36px" }}>
      <h2 style={{ fontSize: "16px", margin: "0 0 14px", color: "#111" }}>By {label}</h2>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
              {[label, "Workers", "Avg Score", "Top", "Risk", "Total Bonus (XAF)", "Salary Increase (XAF)"].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#555", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const col = scoreColor(row.avg)
              const bg  = i % 2 === 0 ? "white" : "#fafafa"
              return (
                <tr key={row.name} style={{ borderBottom: "1px solid #f0f0f0", background: bg }}>
                  <td style={{ padding: "10px 14px", fontWeight: 600 }}>{row.name}</td>
                  <td style={{ padding: "10px 14px", color: "#555" }}>{row.count}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{
                        background: scoreBg(row.avg),
                        border: `1px solid ${col}`,
                        borderRadius: "6px",
                        padding: "2px 10px",
                        fontWeight: 700,
                        color: col,
                        fontSize: "12px",
                      }}>
                        {row.avg}/500
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "10px 14px", fontWeight: 600, color: "#16a34a" }}>{row.topCount}</td>
                  <td style={{ padding: "10px 14px", fontWeight: 600, color: row.riskCount > 0 ? "#dc2626" : "#aaa" }}>{row.riskCount}</td>
                  <td style={{ padding: "10px 14px", fontWeight: 600, color: row.totalBonus > 0 ? "#16a34a" : "#aaa" }}>
                    {row.totalBonus > 0 ? fmt(row.totalBonus) : "—"}
                  </td>
                  <td style={{ padding: "10px 14px", fontWeight: 600, color: row.totalIncrease > 0 ? "#2563eb" : "#aaa" }}>
                    {row.totalIncrease > 0 ? `+${fmt(row.totalIncrease)}` : "—"}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: "2px solid #e5e7eb", background: "#f9fafb", fontWeight: 700 }}>
              <td style={{ padding: "10px 14px" }}>TOTAL</td>
              <td style={{ padding: "10px 14px" }}>{rows.reduce((s, r) => s + r.count, 0)}</td>
              <td style={{ padding: "10px 14px" }} />
              <td style={{ padding: "10px 14px", color: "#16a34a" }}>{rows.reduce((s, r) => s + r.topCount, 0)}</td>
              <td style={{ padding: "10px 14px", color: "#dc2626" }}>{rows.reduce((s, r) => s + r.riskCount, 0)}</td>
              <td style={{ padding: "10px 14px", color: "#16a34a" }}>{fmt(rows.reduce((s, r) => s + r.totalBonus, 0))}</td>
              <td style={{ padding: "10px 14px", color: "#2563eb" }}>+{fmt(rows.reduce((s, r) => s + r.totalIncrease, 0))}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

export default async function AnalyticsPage() {

  const jar     = await cookies()
  const session = await getSession(jar.get("nmi_session")?.value)
  if (!session || !ALLOWED.includes(session.role)) redirect("/dashboard")

  const cid     = resolveCompany(session, jar.get("nmi_company")?.value)
  const records = await prisma.performanceRecord.findMany({
    where:   perfFilter(cid),
    include: { worker: { select: { name: true, department: true, role: true, salaryBase: true } } },
  })

  const byDept = groupRecords(records, "department") as (GroupStats & { avg: number })[]
  const byRole = groupRecords(records, "role")       as (GroupStats & { avg: number })[]

  const totalWorkers   = records.length
  const totalBonus     = records.reduce((s, r) => s + (r.bonusAmount    ?? 0), 0)
  const totalIncrease  = records.reduce((s, r) => s + (r.salaryIncrease ?? 0), 0)
  const deptCount      = byDept.length

  const topWorkers  = records.filter(r => r.totalScore > 400)
  const riskWorkers = records.filter(r => r.totalScore < 250)

  // AI summary
  const bestDept = byDept[0]
  const weakDept = [...byDept].sort((a, b) => a.avg - b.avg)[0]
  const avgOverall = totalWorkers > 0
    ? Math.round(records.reduce((s, r) => s + r.totalScore, 0) / totalWorkers)
    : 0
  const perfLabel = avgOverall >= 400 ? "good" : avgOverall >= 300 ? "medium" : "risk"

  const aiSummary = totalWorkers === 0
    ? "No evaluation data yet. Run performance evaluations to unlock analytics."
    : [
        bestDept ? `Best department: ${bestDept.name} (avg ${bestDept.avg}/500).` : "",
        weakDept && weakDept.name !== bestDept?.name ? `Weak department: ${weakDept.name} (avg ${weakDept.avg}/500).` : "",
        `Total bonus suggested: ${totalBonus.toLocaleString()} XAF.`,
        `Overall performance: ${perfLabel}.`,
        riskWorkers.length > 0 ? `${riskWorkers.length} worker(s) require urgent attention.` : "No critical risk workers.",
      ].filter(Boolean).join(" ")

  const Card = ({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) => (
    <div style={{
      background: "white", border: "1px solid #e5e7eb", borderRadius: "12px",
      padding: "20px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
      borderTop: `4px solid ${color}`,
    }}>
      <div style={{ fontSize: "11px", color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>{label}</div>
      <div style={{ fontSize: "24px", fontWeight: 700, color }}>{value}</div>
      {sub && <div style={{ fontSize: "12px", color: "#999", marginTop: "4px" }}>{sub}</div>}
    </div>
  )

  return (
    <div style={{ padding: "32px", fontFamily: "Arial, sans-serif", color: "#111", maxWidth: "1200px" }}>

      <h1 style={{ margin: "0 0 4px", fontSize: "24px" }}>Executive Analytics</h1>
      <p style={{ margin: "0 0 24px", color: "#666", fontSize: "13px" }}>
        PeopleOS — Department &amp; Role Intelligence · {totalWorkers} evaluation{totalWorkers !== 1 ? "s" : ""}
      </p>

      {/* AI Summary */}
      <div style={{
        background: "#f0fdf4", border: "1px solid #86efac", borderLeft: "4px solid #16a34a",
        borderRadius: "8px", padding: "14px 18px", marginBottom: "28px",
        fontSize: "13px", color: "#14532d", lineHeight: "1.6",
      }}>
        <strong>AI Insight: </strong>{aiSummary}
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "36px" }}>
        <Card label="Workers Evaluated"     value={String(totalWorkers)}            sub="performance records"      color="#7c3aed" />
        <Card label="Departments"           value={String(deptCount)}               sub="tracked"                  color="#0891b2" />
        <Card label="Total Bonus Suggested" value={`${totalBonus.toLocaleString()} XAF`}    sub="combined"        color="#16a34a" />
        <Card label="Total Salary Increase" value={`${totalIncrease.toLocaleString()} XAF`} sub="recommended"     color="#2563eb" />
      </div>

      {totalWorkers === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#aaa", fontSize: "14px" }}>
          No evaluations found. Use the Performance Scorecard to evaluate workers first.
        </div>
      ) : (
        <>
          <AnalyticsTable rows={byDept} label="Department" />
          <AnalyticsTable rows={byRole} label="Role" />

          {/* Top & Risk spotlight */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>

            {topWorkers.length > 0 && (
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "20px" }}>
                <div style={{ fontWeight: 700, color: "#15803d", marginBottom: "12px", fontSize: "14px" }}>
                  Top Performers ({topWorkers.length})
                </div>
                {topWorkers
                  .sort((a, b) => b.totalScore - a.totalScore)
                  .slice(0, 5)
                  .map(r => (
                    <div key={r.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                      <span>{r.worker.name}</span>
                      <span style={{ fontWeight: 700, color: "#16a34a" }}>{r.totalScore}/500</span>
                    </div>
                  ))}
              </div>
            )}

            {riskWorkers.length > 0 && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "20px" }}>
                <div style={{ fontWeight: 700, color: "#dc2626", marginBottom: "12px", fontSize: "14px" }}>
                  Risk Workers ({riskWorkers.length})
                </div>
                {riskWorkers
                  .sort((a, b) => a.totalScore - b.totalScore)
                  .slice(0, 5)
                  .map(r => (
                    <div key={r.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                      <span>{r.worker.name}</span>
                      <span style={{ fontWeight: 700, color: "#dc2626" }}>{r.totalScore}/500</span>
                    </div>
                  ))}
              </div>
            )}

          </div>
        </>
      )}

    </div>
  )
}
