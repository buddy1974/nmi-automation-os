import { cookies }    from "next/headers"
import { redirect }   from "next/navigation"
import { prisma }     from "@/lib/db"
import { getSession } from "@/lib/auth"

export const dynamic = "force-dynamic"

const ALLOWED = ["admin", "owner", "manager", "hr"]

const TOTAL_BONUS_LIMIT    = 1_000_000
const HIGH_BONUS_THRESHOLD = 50_000

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number): string { return n.toLocaleString() }

function scoreLabel(avg: number): string {
  if (avg > 400) return "Excellent"
  if (avg > 300) return "Good"
  if (avg > 250) return "Moderate"
  return "Poor"
}

function today(): string {
  return new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
}

// ── Report sections ───────────────────────────────────────────────────────────

function SectionTitle({ n, title }: { n: number; title: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "12px",
      borderBottom: "2px solid #111", paddingBottom: "6px", marginBottom: "16px", marginTop: "32px",
    }}>
      <span style={{
        background: "#111", color: "white",
        fontWeight: 700, fontSize: "12px",
        width: "24px", height: "24px",
        display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: "50%", flexShrink: 0,
      }}>{n}</span>
      <span style={{ fontWeight: 700, fontSize: "15px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{title}</span>
    </div>
  )
}

function StatRow({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "6px 0", borderBottom: "1px solid #e5e7eb" }}>
      <span style={{ fontSize: "13px", color: "#555" }}>{label}</span>
      <span style={{ fontWeight: 700, fontSize: "13px" }}>
        {value}
        {note && <span style={{ fontWeight: 400, fontSize: "11px", color: "#888", marginLeft: "6px" }}>({note})</span>}
      </span>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ReportPage() {

  const jar     = await cookies()
  const session = await getSession(jar.get("nmi_session")?.value)
  if (!session || !ALLOWED.includes(session.role)) redirect("/dashboard")

  const [records, allWorkers] = await Promise.all([
    prisma.performanceRecord.findMany({
      include: { worker: true },
      orderBy: { totalScore: "desc" },
    }),
    prisma.worker.findMany({ where: { status: "active" } }),
  ])

  // ── Totals ────────────────────────────────────────────────────────────────────
  const totalWorkers     = records.length
  const totalBonus       = records.reduce((s, r) => s + (r.bonusAmount    ?? 0), 0)
  const totalIncrease    = records.reduce((s, r) => s + (r.salaryIncrease ?? 0), 0)
  const totalSuggested   = records.reduce((s, r) => s + (r.suggestedSalary ?? 0), 0)
  const avgScore         = totalWorkers > 0
    ? Math.round(records.reduce((s, r) => s + r.totalScore, 0) / totalWorkers)
    : 0
  const topWorkers       = records.filter(r => r.totalScore > 400)
  const riskWorkers      = records.filter(r => r.totalScore < 250)
  const evaluatedIds     = new Set(records.map(r => r.workerId))
  const missingWorkers   = allWorkers.filter(w => !evaluatedIds.has(w.id))

  // ── Dept stats ────────────────────────────────────────────────────────────────
  const deptMap: Record<string, { scoreSum: number; count: number; bonus: number }> = {}
  for (const r of records) {
    const dept = r.worker.department || "Unassigned"
    if (!deptMap[dept]) deptMap[dept] = { scoreSum: 0, count: 0, bonus: 0 }
    deptMap[dept].scoreSum += r.totalScore
    deptMap[dept].count++
    deptMap[dept].bonus    += r.bonusAmount ?? 0
  }
  const deptRows = Object.entries(deptMap)
    .map(([name, d]) => ({ name, count: d.count, avg: Math.round(d.scoreSum / d.count), bonus: d.bonus }))
    .sort((a, b) => b.avg - a.avg)

  // ── Alert counts ──────────────────────────────────────────────────────────────
  const alertRisk    = riskWorkers.length
  const alertHighBonus = records.filter(r => (r.bonusAmount ?? 0) > HIGH_BONUS_THRESHOLD).length
  const alertWeakDept  = deptRows.filter(d => d.avg < 260).length
  const alertMissing   = missingWorkers.length
  const alertBudget    = totalBonus > TOTAL_BONUS_LIMIT ? 1 : 0
  const totalAlerts    = alertRisk + alertHighBonus + alertWeakDept + alertMissing + alertBudget

  // ── Decision counts ───────────────────────────────────────────────────────────
  const promotions   = records.filter(r => r.totalScore > 450).length
  const bonusSuggest = records.filter(r => r.totalScore > 400 && r.totalScore <= 450).length
  const warnings     = riskWorkers.length
  const costAlerts   = records.filter(r => (r.bonusAmount ?? 0) > HIGH_BONUS_THRESHOLD).length + alertBudget
  const totalDecisions = promotions + bonusSuggest + warnings + costAlerts

  // ── AI narrative ──────────────────────────────────────────────────────────────
  const perfStatus   = avgScore > 400 ? "strong" : avgScore > 300 ? "moderate" : "below expectations"
  const budgetStatus = totalBonus > TOTAL_BONUS_LIMIT ? "requires review — exceeds approved limit" : "within acceptable range"
  const bestDept     = deptRows[0]
  const weakDept     = [...deptRows].sort((a, b) => a.avg - b.avg)[0]

  const narrative = [
    `Overall company performance is ${perfStatus}, with an average score of ${avgScore}/500 across ${totalWorkers} evaluated worker${totalWorkers !== 1 ? "s" : ""}.`,
    totalBonus > 0 ? `Total bonus cost is ${fmt(totalBonus)} XAF, which ${budgetStatus}.` : "",
    bestDept && bestDept.avg > 300 ? `The ${bestDept.name} department leads performance with an average of ${bestDept.avg}/500.` : "",
    weakDept && weakDept.avg < 300 && weakDept.name !== bestDept?.name ? `The ${weakDept.name} department needs improvement with an average of ${weakDept.avg}/500.` : "",
    topWorkers.length > 0 ? `${topWorkers.length} top performer${topWorkers.length > 1 ? "s" : ""} detected — promotion or bonus increase recommended.` : "",
    riskWorkers.length > 0 ? `${riskWorkers.length} worker${riskWorkers.length > 1 ? "s are" : " is"} at critical risk — immediate review required.` : "No critical risk workers detected.",
    missingWorkers.length > 0 ? `${missingWorkers.length} active worker${missingWorkers.length > 1 ? "s" : ""} still require performance evaluation.` : "",
    "System recommends a formal HR review meeting before approving bonus and salary changes.",
  ].filter(Boolean).join(" ")

  return (
    <>
      {/* Print button — hidden in print */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
        }
        @media screen {
          .report-wrap { max-width: 860px; margin: 0 auto; }
        }
      `}</style>

      <div style={{ padding: "32px", fontFamily: "Georgia, serif", color: "#111", background: "white" }}>
        <div className="report-wrap">

          {/* Print button */}
          <div className="no-print" style={{ marginBottom: "24px", textAlign: "right" }}>
            <button
              onClick={() => { if (typeof window !== "undefined") window.print() }}
              style={{
                background: "#111", color: "white",
                border: "none", borderRadius: "6px",
                padding: "8px 20px", fontSize: "13px",
                cursor: "pointer", fontFamily: "Arial, sans-serif",
              }}
            >
              Print / Save as PDF
            </button>
          </div>

          {/* Report header */}
          <div style={{ borderBottom: "3px solid #111", paddingBottom: "20px", marginBottom: "8px" }}>
            <div style={{ fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase", color: "#666", marginBottom: "8px" }}>
              NMI Education SARL — Confidential
            </div>
            <h1 style={{ margin: "0 0 4px", fontSize: "26px", fontWeight: 700, letterSpacing: "-0.5px" }}>
              AI Management Report
            </h1>
            <div style={{ fontSize: "13px", color: "#555" }}>
              Generated: {today()} &nbsp;·&nbsp; PeopleOS AI Engine &nbsp;·&nbsp; {totalWorkers} evaluation{totalWorkers !== 1 ? "s" : ""}
            </div>
          </div>

          {/* ── Section 1: Company Summary ─────────────────────────────────────── */}
          <SectionTitle n={1} title="Company Summary" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 40px" }}>
            <div>
              <StatRow label="Total workers evaluated" value={String(totalWorkers)} />
              <StatRow label="Average performance score" value={`${avgScore} / 500`} note={scoreLabel(avgScore)} />
              <StatRow label="Top performers (score > 400)" value={String(topWorkers.length)} />
              <StatRow label="Risk workers (score < 250)" value={String(riskWorkers.length)} />
            </div>
            <div>
              <StatRow label="Total bonus suggested" value={`${fmt(totalBonus)} XAF`} />
              <StatRow label="Total salary increase suggested" value={`${fmt(totalIncrease)} XAF`} />
              <StatRow label="Total suggested payroll" value={`${fmt(totalSuggested)} XAF`} />
              <StatRow label="Workers awaiting evaluation" value={String(missingWorkers.length)} />
            </div>
          </div>

          {/* ── Section 2: Performance ────────────────────────────────────────── */}
          <SectionTitle n={2} title="Performance Highlights" />

          {topWorkers.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px", color: "#16a34a" }}>
                Top Performers
              </div>
              {topWorkers.slice(0, 5).map(r => (
                <div key={r.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #f0f0f0", fontSize: "13px" }}>
                  <span>{r.worker.name} — {r.worker.department || "—"}</span>
                  <span style={{ fontWeight: 700 }}>{r.totalScore}/500 · {r.rating}</span>
                </div>
              ))}
            </div>
          )}

          {riskWorkers.length > 0 && (
            <div>
              <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px", color: "#dc2626" }}>
                Risk Workers
              </div>
              {riskWorkers.map(r => (
                <div key={r.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #f0f0f0", fontSize: "13px" }}>
                  <span>{r.worker.name} — {r.worker.department || "—"}</span>
                  <span style={{ fontWeight: 700, color: "#dc2626" }}>{r.totalScore}/500 · {r.rating ?? "Critical"}</span>
                </div>
              ))}
            </div>
          )}

          {topWorkers.length === 0 && riskWorkers.length === 0 && (
            <p style={{ color: "#aaa", fontSize: "13px" }}>No evaluation data available.</p>
          )}

          {/* ── Section 3: Department Stats ────────────────────────────────────── */}
          <SectionTitle n={3} title="Department Statistics" />

          {deptRows.length === 0 ? (
            <p style={{ color: "#aaa", fontSize: "13px" }}>No department data available.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #111" }}>
                  {["Department", "Workers", "Avg Score", "Rating", "Total Bonus (XAF)"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "6px 8px", fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.4px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deptRows.map((d, i) => (
                  <tr key={d.name} style={{ borderBottom: "1px solid #e5e7eb", background: i % 2 === 0 ? "white" : "#fafafa" }}>
                    <td style={{ padding: "7px 8px", fontWeight: 600 }}>{d.name}</td>
                    <td style={{ padding: "7px 8px" }}>{d.count}</td>
                    <td style={{ padding: "7px 8px", fontWeight: 700 }}>{d.avg}/500</td>
                    <td style={{ padding: "7px 8px" }}>{scoreLabel(d.avg)}</td>
                    <td style={{ padding: "7px 8px" }}>{d.bonus > 0 ? fmt(d.bonus) : "—"}</td>
                  </tr>
                ))}
                <tr style={{ borderTop: "2px solid #111", fontWeight: 700 }}>
                  <td style={{ padding: "7px 8px" }}>TOTAL</td>
                  <td style={{ padding: "7px 8px" }}>{deptRows.reduce((s, d) => s + d.count, 0)}</td>
                  <td style={{ padding: "7px 8px" }}>{avgScore}/500</td>
                  <td style={{ padding: "7px 8px" }}>{scoreLabel(avgScore)}</td>
                  <td style={{ padding: "7px 8px" }}>{fmt(totalBonus)}</td>
                </tr>
              </tbody>
            </table>
          )}

          {/* ── Section 4: Alerts Summary ─────────────────────────────────────── */}
          <SectionTitle n={4} title="Alerts Summary" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 40px" }}>
            <div>
              <StatRow label="Risk worker alerts"       value={String(alertRisk)}      note={alertRisk > 0 ? "action required" : "none"} />
              <StatRow label="Weak department alerts"   value={String(alertWeakDept)}  note={alertWeakDept > 0 ? "review needed" : "none"} />
              <StatRow label="High bonus alerts"        value={String(alertHighBonus)} />
            </div>
            <div>
              <StatRow label="Budget overrun alerts"    value={String(alertBudget)}    note={alertBudget > 0 ? "exceeds limit" : "within limit"} />
              <StatRow label="Missing evaluation alerts" value={String(alertMissing)} />
              <StatRow label="Total alerts"             value={String(totalAlerts)}    note={totalAlerts === 0 ? "system healthy" : "review required"} />
            </div>
          </div>

          {/* ── Section 5: Decision Summary ───────────────────────────────────── */}
          <SectionTitle n={5} title="AI Decision Summary" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 40px" }}>
            <div>
              <StatRow label="Promotion suggestions"    value={String(promotions)}   />
              <StatRow label="Bonus increase suggestions" value={String(bonusSuggest)} />
            </div>
            <div>
              <StatRow label="Warnings / investigations" value={String(warnings)}    />
              <StatRow label="Cost / budget alerts"      value={String(costAlerts)}  />
            </div>
          </div>
          <div style={{ marginTop: "10px", padding: "8px 12px", background: "#f9fafb", borderRadius: "4px", fontSize: "12px", color: "#555" }}>
            Total AI decisions generated: <strong>{totalDecisions}</strong>
          </div>

          {/* ── Section 6: AI Narrative ───────────────────────────────────────── */}
          <SectionTitle n={6} title="AI Analysis" />
          <div style={{
            fontSize: "13px", lineHeight: "1.9", color: "#222",
            padding: "16px 20px",
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderLeft: "4px solid #111",
            borderRadius: "4px",
          }}>
            {narrative}
          </div>

          {/* Footer */}
          <div style={{
            marginTop: "40px", paddingTop: "16px",
            borderTop: "1px solid #ccc",
            fontSize: "11px", color: "#999",
            display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "4px",
          }}>
            <span>NMI Automation OS — PeopleOS AI Module</span>
            <span>Generated {today()} · Confidential</span>
          </div>

        </div>
      </div>
    </>
  )
}
