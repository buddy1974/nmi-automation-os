import { cookies }    from "next/headers"
import { prisma }     from "@/lib/db"
import { getSession } from "@/lib/auth"
import { resolveCompany, directFilter } from "@/lib/companyFilter"
import { redirect }   from "next/navigation"

export const dynamic = "force-dynamic"

// ── Compensation helpers ───────────────────────────────────────────────────────

function bonusPercent(score: number): number {
  if (score >= 90) return 15
  if (score >= 75) return 10
  if (score >= 60) return 5
  return 0
}

function salaryMultiplier(score: number): number {
  if (score >= 90) return 1.10
  if (score >= 75) return 1.05
  if (score >= 60) return 1.02
  return 1.00
}

function recommendation(score: number): string {
  if (score >= 90) return "Immediate raise + bonus"
  if (score >= 75) return "Bonus recommended"
  if (score >= 60) return "Small raise eligible"
  if (score >= 45) return "Hold — coaching needed"
  return "Performance review required"
}

function scoreColor(score: number) {
  if (score >= 90) return "#16a34a"
  if (score >= 75) return "#1a73e8"
  if (score >= 60) return "#d97706"
  if (score >= 45) return "#ea580c"
  return "#dc2626"
}

function fmtXAF(n: number) {
  return n.toLocaleString("fr-FR") + " XAF"
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function CompensationPage() {
  const jar     = await cookies()
  const session = await getSession(jar.get("nmi_session")?.value)

  if (!session || !["admin", "owner", "manager"].includes(session.role)) {
    redirect("/dashboard")
  }

  const cid = resolveCompany(session, jar.get("nmi_company")?.value)

  const workers = await prisma.worker.findMany({
    where:   directFilter(cid),
    orderBy: { name: "asc" },
  })

  // Latest EvaluationSession per worker (by workerId string)
  const latestEvals = await prisma.evaluationSession.findMany({
    where:   cid ? { companyId: cid } : {},
    orderBy: { createdAt: "desc" },
  })

  const latestByWorker = new Map<string, typeof latestEvals[0]>()
  for (const ev of latestEvals) {
    if (!latestByWorker.has(ev.workerId)) latestByWorker.set(ev.workerId, ev)
  }

  // Build rows — match by workerName since Worker.id is Int and EvaluationSession.workerId is String
  const latestByName = new Map<string, typeof latestEvals[0]>()
  for (const ev of latestEvals) {
    if (!latestByName.has(ev.workerName)) latestByName.set(ev.workerName, ev)
  }

  const rows = workers.map(w => {
    const ev      = latestByName.get(w.name)
    const score   = ev?.totalScore ?? null
    const base    = Number(w.salaryBase)
    const mult    = score !== null ? salaryMultiplier(score) : 1
    const suggest = Math.round(base * mult)
    const diff    = suggest - base
    const bPct    = score !== null ? bonusPercent(score) : 0
    const bonus   = Math.round(base * bPct / 100)
    const rec     = score !== null ? recommendation(score) : "No evaluation on record"
    return { w, score, base, suggest, diff, bPct, bonus, rec, period: ev?.period ?? null }
  })

  const totalBase    = rows.reduce((s, r) => s + r.base, 0)
  const totalSuggest = rows.reduce((s, r) => s + r.suggest, 0)
  const totalBonus   = rows.reduce((s, r) => s + r.bonus, 0)
  const evaluated    = rows.filter(r => r.score !== null).length

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111", margin: 0 }}>Compensation Planner</h1>
        <p style={{ color: "#6b7280", marginTop: 6, fontSize: 14 }}>
          Salary suggestions and bonus calculations based on latest evaluation scores.
          Bonus tiers: 90+ → 15% · 75+ → 10% · 60+ → 5% · below → 0%
        </p>
      </div>

      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <KpiCard label="Workers"         value={String(workers.length)} sub="on payroll" color="#374151" />
        <KpiCard label="Evaluated"       value={String(evaluated)}      sub={`of ${workers.length} have scores`} color="#1a73e8" />
        <KpiCard label="Current Payroll" value={fmtXAF(totalBase)}      sub="total base salaries" color="#374151" />
        <KpiCard label="Suggested Payroll" value={fmtXAF(totalSuggest)} sub={`+${fmtXAF(totalSuggest - totalBase)} projected`} color={totalSuggest > totalBase ? "#16a34a" : "#374151"} />
      </div>

      {/* Bonus summary */}
      {totalBonus > 0 && (
        <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 10, padding: "14px 20px", marginBottom: 24, fontSize: 14, color: "#92400e" }}>
          <strong>Bonus pool estimate:</strong> {fmtXAF(totalBonus)} across {rows.filter(r => r.bonus > 0).length} eligible employees
        </div>
      )}

      {/* Table */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
              {["Employee", "Role / Dept", "Eval Score", "Period", "Current Salary", "Suggested Salary", "Difference", "Bonus %", "Bonus Amount", "Recommendation"].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.w.id} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                <td style={{ padding: "12px 14px", fontWeight: 600, fontSize: 14 }}>{r.w.name}</td>
                <td style={{ padding: "12px 14px", fontSize: 13, color: "#6b7280" }}>
                  {r.w.role || "—"}<br />
                  <span style={{ fontSize: 11, color: "#9ca3af" }}>{r.w.department || "—"}</span>
                </td>
                <td style={{ padding: "12px 14px" }}>
                  {r.score !== null ? (
                    <span style={{ fontSize: 16, fontWeight: 700, color: scoreColor(r.score) }}>{r.score.toFixed(1)}</span>
                  ) : (
                    <span style={{ fontSize: 12, color: "#9ca3af" }}>No eval</span>
                  )}
                </td>
                <td style={{ padding: "12px 14px", fontSize: 12, color: "#9ca3af" }}>{r.period ?? "—"}</td>
                <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 500 }}>{r.base > 0 ? fmtXAF(r.base) : <span style={{ color: "#9ca3af" }}>Not set</span>}</td>
                <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 600, color: r.diff > 0 ? "#16a34a" : "#374151" }}>
                  {r.base > 0 ? fmtXAF(r.suggest) : "—"}
                </td>
                <td style={{ padding: "12px 14px" }}>
                  {r.diff > 0 ? (
                    <span style={{ color: "#16a34a", fontWeight: 600, fontSize: 13 }}>+{fmtXAF(r.diff)}</span>
                  ) : r.diff < 0 ? (
                    <span style={{ color: "#dc2626", fontWeight: 600, fontSize: 13 }}>{fmtXAF(r.diff)}</span>
                  ) : (
                    <span style={{ color: "#9ca3af", fontSize: 13 }}>—</span>
                  )}
                </td>
                <td style={{ padding: "12px 14px" }}>
                  {r.bPct > 0 ? (
                    <span style={{ background: "#f0fdf4", color: "#16a34a", padding: "3px 10px", borderRadius: 12, fontSize: 12, fontWeight: 700 }}>{r.bPct}%</span>
                  ) : (
                    <span style={{ color: "#9ca3af", fontSize: 12 }}>0%</span>
                  )}
                </td>
                <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: r.bonus > 0 ? 600 : 400, color: r.bonus > 0 ? "#16a34a" : "#9ca3af" }}>
                  {r.bonus > 0 ? fmtXAF(r.bonus) : "—"}
                </td>
                <td style={{ padding: "12px 14px", fontSize: 12, color: "#374151", maxWidth: 200 }}>{r.rec}</td>
              </tr>
            ))}
          </tbody>

          {/* Totals row */}
          <tfoot>
            <tr style={{ background: "#f9fafb", borderTop: "2px solid #e5e7eb" }}>
              <td colSpan={4} style={{ padding: "12px 14px", fontWeight: 700, fontSize: 13 }}>TOTALS</td>
              <td style={{ padding: "12px 14px", fontWeight: 700, fontSize: 13 }}>{fmtXAF(totalBase)}</td>
              <td style={{ padding: "12px 14px", fontWeight: 700, fontSize: 13, color: "#16a34a" }}>{fmtXAF(totalSuggest)}</td>
              <td style={{ padding: "12px 14px", fontWeight: 700, fontSize: 13, color: "#16a34a" }}>+{fmtXAF(totalSuggest - totalBase)}</td>
              <td colSpan={2} style={{ padding: "12px 14px", fontWeight: 700, fontSize: 13, color: "#16a34a" }}>{fmtXAF(totalBonus)} bonus pool</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "16px 20px" }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", marginBottom: 4 }}>{label.toUpperCase()}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{sub}</div>
    </div>
  )
}
