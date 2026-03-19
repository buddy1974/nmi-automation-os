import { cookies }    from "next/headers"
import { redirect }   from "next/navigation"
import { prisma }     from "@/lib/db"
import { getSession } from "@/lib/auth"

export const dynamic = "force-dynamic"

const ALLOWED = ["admin", "owner", "manager", "hr"]

// ── Decision types ────────────────────────────────────────────────────────────

type DecisionLevel = "low" | "medium" | "high"
type DecisionType  = "promotion" | "bonus" | "salary" | "warning" | "department" | "cost" | "info" | "missing"

interface Decision {
  type:    DecisionType
  level:   DecisionLevel
  action:  string        // short imperative: "Promote John"
  reason:  string        // why
  impact?: string        // what happens if ignored
}

// ── Visual ────────────────────────────────────────────────────────────────────

const LEVEL_STYLE: Record<DecisionLevel, { bg: string; border: string; badge: string; text: string }> = {
  high:   { bg: "#fef2f2", border: "#fecaca", badge: "#dc2626", text: "#7f1d1d" },
  medium: { bg: "#fffbeb", border: "#fde68a", badge: "#d97706", text: "#78350f" },
  low:    { bg: "#f0fdf4", border: "#bbf7d0", badge: "#16a34a", text: "#14532d" },
}

const TYPE_CONFIG: Record<DecisionType, { icon: string; label: string }> = {
  promotion:  { icon: "🚀", label: "Promotion"   },
  bonus:      { icon: "💰", label: "Bonus"        },
  salary:     { icon: "📈", label: "Salary"       },
  warning:    { icon: "⚠️",  label: "Warning"      },
  department: { icon: "🏢", label: "Department"   },
  cost:       { icon: "💸", label: "Cost"         },
  info:       { icon: "ℹ️",  label: "Info"         },
  missing:    { icon: "📋", label: "Data Missing" },
}

const RISK_THRESHOLD         = 3     // alert if >= 3 risk workers company-wide
const HIGH_BONUS_THRESHOLD   = 50_000
const TOTAL_BONUS_LIMIT      = 1_000_000

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DecisionsPage() {

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

  // ── Aggregates ───────────────────────────────────────────────────────────────
  const totalBonus     = records.reduce((s, r) => s + (r.bonusAmount    ?? 0), 0)
  const totalIncrease  = records.reduce((s, r) => s + (r.salaryIncrease ?? 0), 0)
  const riskWorkers    = records.filter(r => r.totalScore < 250)
  const topWorkers     = records.filter(r => r.totalScore > 450)
  const evaluatedIds   = new Set(records.map(r => r.workerId))
  const missingWorkers = allWorkers.filter(w => !evaluatedIds.has(w.id))

  // Dept averages
  const deptMap: Record<string, { scoreSum: number; count: number }> = {}
  for (const r of records) {
    const dept = r.worker.department || "Unassigned"
    if (!deptMap[dept]) deptMap[dept] = { scoreSum: 0, count: 0 }
    deptMap[dept].scoreSum += r.totalScore
    deptMap[dept].count++
  }
  const deptStats = Object.entries(deptMap).map(([name, d]) => ({
    name, avg: Math.round(d.scoreSum / d.count), count: d.count,
  }))

  // ── Build decisions ──────────────────────────────────────────────────────────
  const decisions: Decision[] = []

  // Rule 1 — Promote outstanding workers (score > 450)
  for (const r of records.filter(rec => rec.totalScore > 450)) {
    decisions.push({
      type:   "promotion",
      level:  "low",
      action: `Promote ${r.worker.name}`,
      reason: `Score ${r.totalScore}/500 — Outstanding. This worker consistently exceeds all KPIs.`,
      impact: "Retaining top talent requires recognition. Delay risks losing them to competitors.",
    })
  }

  // Rule 2 — Increase bonus for excellent workers (score > 400, not outstanding)
  for (const r of records.filter(rec => rec.totalScore > 400 && rec.totalScore <= 450)) {
    decisions.push({
      type:   "bonus",
      level:  "low",
      action: `Increase bonus for ${r.worker.name}`,
      reason: `Score ${r.totalScore}/500 — Excellent. Suggested bonus: ${(r.bonusAmount ?? 0).toLocaleString()} XAF.`,
      impact: "Rewarding high performers reinforces positive behavior across the team.",
    })
  }

  // Rule 3 — Warning / training for risk workers (score < 250)
  for (const r of riskWorkers) {
    decisions.push({
      type:   "warning",
      level:  "high",
      action: `Investigate ${r.worker.name}`,
      reason: `Score ${r.totalScore}/500 — Critical. Performance is well below acceptable level (250/500).`,
      impact: "If unaddressed, this worker may negatively impact team morale and output.",
    })
  }

  // Rule 4 — Check salary for large increase proposals (> 20% of base)
  for (const r of records) {
    const base = r.baseSalary ?? 0
    if (base > 0 && (r.salaryIncrease ?? 0) > base * 0.20) {
      const pct = (((r.salaryIncrease ?? 0) / base) * 100).toFixed(1)
      decisions.push({
        type:   "salary",
        level:  "medium",
        action: `Review salary increase for ${r.worker.name}`,
        reason: `Proposed increase is ${pct}% of base salary (+${(r.salaryIncrease ?? 0).toLocaleString()} XAF). Requires budget approval.`,
        impact: "Approving without review may create budget pressure or internal pay equity issues.",
      })
    }
  }

  // Rule 5 — Check individual high bonuses (> threshold)
  for (const r of records.filter(rec => (rec.bonusAmount ?? 0) > HIGH_BONUS_THRESHOLD)) {
    decisions.push({
      type:   "cost",
      level:  "medium",
      action: `Verify bonus allocation for ${r.worker.name}`,
      reason: `Bonus suggested: ${(r.bonusAmount ?? 0).toLocaleString()} XAF — above single-worker threshold.`,
      impact: "Ensure this aligns with the approved HR budget before payment.",
    })
  }

  // Rule 6 — Weak department (avg < 260)
  for (const d of deptStats.filter(dep => dep.avg < 260)) {
    decisions.push({
      type:   "department",
      level:  "high",
      action: `Take action in ${d.name} department`,
      reason: `Average score: ${d.avg}/500 across ${d.count} worker(s). Department performance is critical.`,
      impact: "A weak department affects delivery, quality, and overall company output.",
    })
  }

  // Rule 7 — Strong department (avg > 400)
  for (const d of deptStats.filter(dep => dep.avg > 400)) {
    decisions.push({
      type:   "department",
      level:  "low",
      action: `Recognize ${d.name} department`,
      reason: `Average score: ${d.avg}/500 across ${d.count} worker(s). This department is performing strongly.`,
      impact: "Public recognition motivates the team and sets a standard for others.",
    })
  }

  // Rule 8 — Too many risk workers company-wide
  if (riskWorkers.length >= RISK_THRESHOLD) {
    decisions.push({
      type:   "warning",
      level:  "high",
      action: "Escalate to management — multiple risk workers",
      reason: `${riskWorkers.length} workers scored below 250/500. This may indicate a systemic management or training problem.`,
      impact: "Without intervention, team quality will continue to decline and affect business outcomes.",
    })
  }

  // Rule 9 — Missing performance data
  if (missingWorkers.length > 0) {
    decisions.push({
      type:   "missing",
      level:  "medium",
      action: `Evaluate ${missingWorkers.length} worker${missingWorkers.length > 1 ? "s" : ""} with no performance record`,
      reason: `Workers without evaluations: ${missingWorkers.map(w => w.name).join(", ")}.`,
      impact: "Incomplete data means incomplete decisions. Blind spots cost money.",
    })
  }

  // Rule 10 — Total bonus budget overrun
  if (totalBonus > TOTAL_BONUS_LIMIT) {
    decisions.push({
      type:   "cost",
      level:  "high",
      action: "Review total bonus budget",
      reason: `Suggested total bonus: ${totalBonus.toLocaleString()} XAF — exceeds approved limit of ${TOTAL_BONUS_LIMIT.toLocaleString()} XAF.`,
      impact: "Paying out without review may cause a cash flow problem at end of quarter.",
    })
  }

  // Sort: high → medium → low
  const ORDER: Record<DecisionLevel, number> = { high: 0, medium: 1, low: 2 }
  decisions.sort((a, b) => ORDER[a.level] - ORDER[b.level])

  // ── Status ────────────────────────────────────────────────────────────────────
  const highCount    = decisions.filter(d => d.level === "high").length
  const medCount     = decisions.filter(d => d.level === "medium").length
  const statusLabel  = highCount > 0 ? "critical" : medCount > 0 ? "warning" : "good"
  const statusColor  = highCount > 0 ? "#dc2626" : medCount > 0 ? "#d97706" : "#16a34a"
  const statusBg     = highCount > 0 ? "#fef2f2" : medCount > 0 ? "#fffbeb" : "#f0fdf4"
  const statusBorder = highCount > 0 ? "#fecaca" : medCount > 0 ? "#fde68a" : "#86efac"
  const statusText   = highCount > 0 ? "#7f1d1d" : medCount > 0 ? "#78350f" : "#14532d"

  const aiSummary =
    `Company status: ${statusLabel}. ` +
    `Top workers: ${topWorkers.length}. ` +
    `Risk workers: ${riskWorkers.length}. ` +
    `Suggested bonus total: ${totalBonus.toLocaleString()} XAF. ` +
    `Suggested salary increase: ${totalIncrease.toLocaleString()} XAF.`

  return (
    <div style={{ padding: "32px", fontFamily: "Arial, sans-serif", color: "#111", maxWidth: "960px" }}>

      <h1 style={{ margin: "0 0 4px", fontSize: "24px" }}>AI Decision Suggestions</h1>
      <p style={{ margin: "0 0 24px", color: "#666", fontSize: "13px" }}>
        PeopleOS — AI-generated action recommendations · {decisions.length} suggestion{decisions.length !== 1 ? "s" : ""}
      </p>

      {/* Status banner */}
      <div style={{
        background: statusBg, border: `1px solid ${statusBorder}`,
        borderLeft: `4px solid ${statusColor}`, borderRadius: "8px",
        padding: "14px 18px", marginBottom: "28px",
        fontSize: "13px", color: statusText, lineHeight: "1.6",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <span style={{
            background: statusColor, color: "white",
            fontWeight: 700, fontSize: "11px",
            padding: "2px 10px", borderRadius: "20px",
            textTransform: "uppercase", letterSpacing: "0.5px",
          }}>
            {statusLabel}
          </span>
          <span><strong>AI Status: </strong>{aiSummary}</span>
        </div>
      </div>

      {/* Priority counters */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "28px" }}>
        {([
          { level: "high",   label: "Urgent",   color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
          { level: "medium", label: "Review",   color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
          { level: "low",    label: "Positive", color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
        ] as const).map(({ level, label, color, bg, border }) => (
          <div key={level} style={{
            background: bg, border: `1px solid ${border}`,
            borderRadius: "8px", padding: "10px 20px",
            display: "flex", flexDirection: "column", alignItems: "center", minWidth: "90px",
          }}>
            <div style={{ fontSize: "22px", fontWeight: 700, color }}>
              {decisions.filter(d => d.level === level).length}
            </div>
            <div style={{ fontSize: "11px", color, fontWeight: 600 }}>{label}</div>
          </div>
        ))}
        <div style={{
          background: "#f9fafb", border: "1px solid #e5e7eb",
          borderRadius: "8px", padding: "10px 20px",
          display: "flex", flexDirection: "column", alignItems: "center", minWidth: "90px",
        }}>
          <div style={{ fontSize: "22px", fontWeight: 700, color: "#555" }}>{decisions.length}</div>
          <div style={{ fontSize: "11px", color: "#888", fontWeight: 600 }}>Total</div>
        </div>
      </div>

      {/* Decision cards */}
      {decisions.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "60px 0",
          color: "#16a34a", fontSize: "15px", fontWeight: 600,
        }}>
          No decisions needed. Company performance is healthy.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {decisions.map((d, i) => {
            const s  = LEVEL_STYLE[d.level]
            const tc = TYPE_CONFIG[d.type]
            return (
              <div key={i} style={{
                background: s.bg,
                border: `1px solid ${s.border}`,
                borderLeft: `4px solid ${s.badge}`,
                borderRadius: "8px",
                padding: "16px 20px",
              }}>
                {/* Action line */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
                  <span style={{ fontSize: "18px" }}>{tc.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: "14px", color: s.text }}>{d.action}</span>
                  <span style={{
                    background: s.badge, color: "white",
                    fontSize: "10px", fontWeight: 700,
                    padding: "2px 8px", borderRadius: "20px",
                    textTransform: "uppercase", letterSpacing: "0.4px",
                  }}>
                    {d.level === "high" ? "urgent" : d.level === "medium" ? "review" : "positive"}
                  </span>
                  <span style={{
                    background: "rgba(0,0,0,0.06)", color: s.text,
                    fontSize: "10px", fontWeight: 600,
                    padding: "2px 8px", borderRadius: "20px",
                  }}>
                    {tc.label}
                  </span>
                </div>

                {/* Reason */}
                <div style={{ fontSize: "12px", color: s.text, marginBottom: d.impact ? "6px" : 0, opacity: 0.9 }}>
                  <strong>Why: </strong>{d.reason}
                </div>

                {/* Impact */}
                {d.impact && (
                  <div style={{ fontSize: "12px", color: s.text, opacity: 0.75, fontStyle: "italic" }}>
                    <strong>Impact if ignored: </strong>{d.impact}
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
