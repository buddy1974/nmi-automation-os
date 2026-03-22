import { cookies }    from "next/headers"
import { redirect }   from "next/navigation"
import { prisma }     from "@/lib/db"
import { getSession } from "@/lib/auth"
import EvalForm       from "./EvalForm"

export const dynamic = "force-dynamic"

const ALLOWED = ["admin", "hr", "manager"]

function barColor(pct: number): string {
  if (pct > 80) return "#16a34a"
  if (pct > 60) return "#1a73e8"
  if (pct > 40) return "#d97706"
  return "#dc2626"
}

function ratingColor(rating: string | null): string {
  switch (rating) {
    case "Outstanding":       return "#16a34a"
    case "Excellent":         return "#1a73e8"
    case "Very Good":         return "#7c3aed"
    case "Good":              return "#d97706"
    case "Needs Improvement": return "#ea580c"
    default:                  return "#dc2626"
  }
}

function Bar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <div style={{ flex: 1, height: "8px", background: "#e5e7eb", borderRadius: "99px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: barColor(pct), borderRadius: "99px" }} />
      </div>
      <span style={{ fontSize: "11px", color: "#555", minWidth: "28px", textAlign: "right" }}>{value}</span>
    </div>
  )
}

export default async function PerformancePage() {

  const jar     = await cookies()
  const session = await getSession(jar.get("nmi_session")?.value)
  if (!session || !ALLOWED.includes(session.role)) redirect("/dashboard")

  const [workers, records] = await Promise.all([
    prisma.worker.findMany({ where: { status: "active" }, orderBy: { name: "asc" } }),
    prisma.performanceRecord.findMany({
      include: { worker: { select: { name: true, role: true, department: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ])

  return (
    <div style={{ padding: "32px", fontFamily: "Arial, sans-serif", color: "#111" }}>

      <h1 style={{ margin: "0 0 4px", fontSize: "24px" }}>AI Performance Scorecard</h1>
      <p style={{ margin: "0 0 32px", color: "#666", fontSize: "13px" }}>
        PeopleOS — Score /500 · Rating · Bonus · AI Summary · Recommendations
      </p>

      <EvalForm workers={workers.map(w => ({ id: w.id, name: w.name, role: w.role }))} />

      <h2 style={{ fontSize: "16px", margin: "0 0 20px" }}>Evaluations ({records.length})</h2>

      {records.length === 0 ? (
        <p style={{ color: "#aaa" }}>No evaluations yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {records.map(r => {
            const pct = r.scorePercent ?? 0
            return (
              <div key={r.id} style={{
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                padding: "20px 24px",
                background: "white",
                boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
              }}>

                {/* Header row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "16px" }}>{r.worker.name}</div>
                    <div style={{ fontSize: "12px", color: "#888" }}>{r.worker.role} — {r.worker.department || "No dept"} · {r.period}</div>
                  </div>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                    {r.rating && (
                      <span style={{
                        padding: "4px 12px", borderRadius: "6px", fontSize: "12px",
                        fontWeight: 700, color: "white",
                        background: ratingColor(r.rating),
                      }}>
                        {r.rating}
                      </span>
                    )}
                    <span style={{ fontSize: "18px", fontWeight: 700, color: barColor(pct) }}>
                      {r.totalScore}/500
                    </span>
                    <span style={{ fontSize: "13px", color: "#888" }}>
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Overall bar */}
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ fontSize: "11px", color: "#888", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Overall</div>
                  <div style={{ height: "12px", background: "#e5e7eb", borderRadius: "99px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: barColor(pct), borderRadius: "99px", transition: "width 0.3s" }} />
                  </div>
                </div>

                {/* KPI bars */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px", marginBottom: "16px" }}>
                  {[
                    { label: "Attendance",   value: r.attendance },
                    { label: "Productivity", value: r.productivity },
                    { label: "Quality",      value: r.quality },
                    { label: "Teamwork",     value: r.teamwork },
                    { label: "Discipline",   value: r.discipline },
                  ].map(kpi => (
                    <div key={kpi.label}>
                      <div style={{ fontSize: "11px", color: "#888", marginBottom: "4px" }}>{kpi.label}</div>
                      <Bar value={kpi.value} />
                    </div>
                  ))}
                </div>

                {/* Bonus + Recommendation + AI Summary */}
                <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", borderTop: "1px solid #f0f0f0", paddingTop: "12px" }}>
                  {r.bonusScore !== null && r.bonusScore > 0 && (
                    <div>
                      <span style={{ fontSize: "11px", color: "#888" }}>Bonus score </span>
                      <span style={{ fontWeight: 700, color: "#16a34a" }}>{r.bonusScore}%</span>
                    </div>
                  )}
                  {r.recommendation && (
                    <div>
                      <span style={{ fontSize: "11px", color: "#888" }}>Recommendation: </span>
                      <span style={{ fontWeight: 600, color: ratingColor(r.rating) }}>{r.recommendation}</span>
                    </div>
                  )}
                  {r.aiSummary && (
                    <div style={{ width: "100%", fontSize: "12px", color: "#555", fontStyle: "italic", marginTop: "4px" }}>
                      {r.aiSummary}
                    </div>
                  )}
                  {r.managerNote && (
                    <div style={{ width: "100%", fontSize: "12px", color: "#374151", background: "#f9fafb", padding: "8px 12px", borderRadius: "6px", borderLeft: "3px solid #d1d5db" }}>
                      <strong>Manager note:</strong> {r.managerNote}
                    </div>
                  )}
                </div>

                {/* Salary / Bonus Engine block */}
                {(r.baseSalary != null || r.bonusAmount != null) && (
                  <div style={{ marginTop: "14px", borderTop: "1px solid #f0f0f0", paddingTop: "14px" }}>
                    <div style={{ fontSize: "11px", color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>
                      Salary &amp; Bonus Suggestion
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>

                      {r.baseSalary != null && (
                        <div style={{ background: "#f9fafb", borderRadius: "8px", padding: "10px 14px" }}>
                          <div style={{ fontSize: "10px", color: "#888", marginBottom: "2px" }}>Base Salary</div>
                          <div style={{ fontWeight: 700, fontSize: "14px" }}>{r.baseSalary.toLocaleString()} XAF</div>
                        </div>
                      )}

                      {r.bonusPercent != null && (
                        <div style={{ background: "#f9fafb", borderRadius: "8px", padding: "10px 14px" }}>
                          <div style={{ fontSize: "10px", color: "#888", marginBottom: "2px" }}>Bonus %</div>
                          <div style={{ fontWeight: 700, fontSize: "14px" }}>{((r.bonusPercent ?? 0) * 100).toFixed(0)}%</div>
                        </div>
                      )}

                      {r.bonusAmount != null && (
                        <div style={{ background: (r.bonusAmount ?? 0) > 0 ? "#f0fdf4" : "#f9fafb", borderRadius: "8px", padding: "10px 14px", border: (r.bonusAmount ?? 0) > 0 ? "1px solid #bbf7d0" : "none" }}>
                          <div style={{ fontSize: "10px", color: "#888", marginBottom: "2px" }}>Bonus Amount</div>
                          <div style={{ fontWeight: 700, fontSize: "14px", color: (r.bonusAmount ?? 0) > 0 ? "#16a34a" : "#111" }}>
                            {(r.bonusAmount ?? 0).toLocaleString()} XAF
                          </div>
                        </div>
                      )}

                      {r.salaryIncrease != null && (
                        <div style={{ background: (r.salaryIncrease ?? 0) > 0 ? "#eff6ff" : "#f9fafb", borderRadius: "8px", padding: "10px 14px", border: (r.salaryIncrease ?? 0) > 0 ? "1px solid #bfdbfe" : "none" }}>
                          <div style={{ fontSize: "10px", color: "#888", marginBottom: "2px" }}>Salary Increase</div>
                          <div style={{ fontWeight: 700, fontSize: "14px", color: (r.salaryIncrease ?? 0) > 0 ? "#1a73e8" : "#111" }}>
                            +{(r.salaryIncrease ?? 0).toLocaleString()} XAF
                          </div>
                        </div>
                      )}

                      {r.suggestedSalary != null && (
                        <div style={{ background: "#fefce8", borderRadius: "8px", padding: "10px 14px", border: "1px solid #fde68a" }}>
                          <div style={{ fontSize: "10px", color: "#888", marginBottom: "2px" }}>Suggested Salary</div>
                          <div style={{ fontWeight: 700, fontSize: "14px", color: "#92400e" }}>
                            {(r.suggestedSalary ?? 0).toLocaleString()} XAF
                          </div>
                        </div>
                      )}

                    </div>

                    {r.aiBonusSummary && (
                      <div style={{ marginTop: "10px", fontSize: "12px", color: "#374151", background: "#f0fdf4", padding: "8px 12px", borderRadius: "6px", borderLeft: "3px solid #86efac" }}>
                        {r.aiBonusSummary}
                      </div>
                    )}
                  </div>
                )}

              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
