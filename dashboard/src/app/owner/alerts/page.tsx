import { cookies }    from "next/headers"
import { redirect }   from "next/navigation"
import { prisma }     from "@/lib/db"
import { getSession } from "@/lib/auth"
import { resolveCompany, perfFilter, directFilter } from "@/lib/companyFilter"

export const dynamic = "force-dynamic"

const ALLOWED = ["admin", "owner", "manager", "hr"]

// ── Alert types ───────────────────────────────────────────────────────────────

type AlertLevel = "low" | "medium" | "high"
type AlertType  = "risk" | "bonus" | "salary" | "department" | "cost" | "info" | "missing"

interface Alert {
  type:    AlertType
  level:   AlertLevel
  message: string
  detail?: string
}

// ── Visual config ─────────────────────────────────────────────────────────────

const LEVEL_STYLE: Record<AlertLevel, { bg: string; border: string; text: string; badge: string }> = {
  high:   { bg: "#fef2f2", border: "#fecaca", text: "#7f1d1d", badge: "#dc2626" },
  medium: { bg: "#fffbeb", border: "#fde68a", text: "#78350f", badge: "#d97706" },
  low:    { bg: "#eff6ff", border: "#bfdbfe", text: "#1e3a5f", badge: "#1a73e8" },
}

const TYPE_ICON: Record<AlertType, string> = {
  risk:       "⚠",
  bonus:      "💰",
  salary:     "📈",
  department: "🏢",
  cost:       "💸",
  info:       "⭐",
  missing:    "📋",
}

const TOTAL_BONUS_LIMIT = 1_000_000   // 1 million XAF

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AlertsPage() {

  const jar     = await cookies()
  const session = await getSession(jar.get("nmi_session")?.value)
  if (!session || !ALLOWED.includes(session.role)) redirect("/dashboard")

  // Load data
  const cid = resolveCompany(session, jar.get("nmi_company")?.value)
  const [records, allWorkers] = await Promise.all([
    prisma.performanceRecord.findMany({
      where:    perfFilter(cid),
      include:  { worker: true },
      orderBy:  { totalScore: "asc" },
    }),
    prisma.worker.findMany({ where: { status: "active", ...directFilter(cid) } }),
  ])

  // ── Aggregate metrics ────────────────────────────────────────────────────────
  const totalBonus     = records.reduce((s, r) => s + (r.bonusAmount    ?? 0), 0)
  const totalIncrease  = records.reduce((s, r) => s + (r.salaryIncrease ?? 0), 0)
  const topWorkers     = records.filter(r => r.totalScore > 450)
  const riskWorkers    = records.filter(r => r.totalScore < 250)
  const evaluatedIds   = new Set(records.map(r => r.workerId))
  const missingWorkers = allWorkers.filter(w => !evaluatedIds.has(w.id))

  // Department averages
  const deptMap: Record<string, { scoreSum: number; count: number }> = {}
  for (const r of records) {
    const dept = r.worker.department || "Unassigned"
    if (!deptMap[dept]) deptMap[dept] = { scoreSum: 0, count: 0 }
    deptMap[dept].scoreSum += r.totalScore
    deptMap[dept].count++
  }
  const weakDepts = Object.entries(deptMap)
    .map(([name, d]) => ({ name, avg: Math.round(d.scoreSum / d.count) }))
    .filter(d => d.avg < 260)

  // ── Build alert list ─────────────────────────────────────────────────────────
  const alerts: Alert[] = []

  // Rule 1 — risk workers (score < 250)
  for (const r of riskWorkers) {
    alerts.push({
      type:    "risk",
      level:   "high",
      message: `${r.worker.name} is at risk`,
      detail:  `Score ${r.totalScore}/500 — ${r.rating ?? "Critical"}. Immediate coaching required.`,
    })
  }

  // Rule 2 — top performers (score > 450)
  for (const r of topWorkers) {
    alerts.push({
      type:    "info",
      level:   "low",
      message: `${r.worker.name} is an outstanding performer`,
      detail:  `Score ${r.totalScore}/500. Recommended for promotion track.`,
    })
  }

  // Rule 3 — high individual bonus (> 50,000 XAF)
  for (const r of records) {
    if ((r.bonusAmount ?? 0) > 50_000) {
      alerts.push({
        type:    "bonus",
        level:   "medium",
        message: `High bonus suggested for ${r.worker.name}`,
        detail:  `Bonus amount: ${(r.bonusAmount ?? 0).toLocaleString()} XAF. Verify budget allocation before approving.`,
      })
    }
  }

  // Rule 4 — salary increase > 20% of base salary
  for (const r of records) {
    const base = r.baseSalary ?? 0
    if (base > 0 && (r.salaryIncrease ?? 0) > base * 0.20) {
      alerts.push({
        type:    "salary",
        level:   "medium",
        message: `Large salary increase for ${r.worker.name}`,
        detail:  `Suggested increase: ${(r.salaryIncrease ?? 0).toLocaleString()} XAF (+${(((r.salaryIncrease ?? 0) / base) * 100).toFixed(1)}% of base). Review before applying.`,
      })
    }
  }

  // Rule 5 — weak department (avg < 260)
  for (const d of weakDepts) {
    alerts.push({
      type:    "department",
      level:   "high",
      message: `Department "${d.name}" needs attention`,
      detail:  `Average score: ${d.avg}/500 — below acceptable threshold (260). Consider training or restructuring.`,
    })
  }

  // Rule 6 — total bonus exceeds budget limit
  if (totalBonus > TOTAL_BONUS_LIMIT) {
    alerts.push({
      type:    "cost",
      level:   "high",
      message: "Total bonus cost exceeds budget threshold",
      detail:  `Recommended total: ${totalBonus.toLocaleString()} XAF — above limit of ${TOTAL_BONUS_LIMIT.toLocaleString()} XAF. Review individual allocations.`,
    })
  }

  // Rule 7 — workers with no performance record
  if (missingWorkers.length > 0) {
    alerts.push({
      type:    "missing",
      level:   "low",
      message: `${missingWorkers.length} active worker${missingWorkers.length > 1 ? "s" : ""} have no performance evaluation`,
      detail:  missingWorkers.map(w => w.name).join(", "),
    })
  }

  // Sort: high → medium → low
  const ORDER: Record<AlertLevel, number> = { high: 0, medium: 1, low: 2 }
  alerts.sort((a, b) => ORDER[a.level] - ORDER[b.level])

  // ── System status ────────────────────────────────────────────────────────────
  const highCount   = alerts.filter(a => a.level === "high").length
  const medCount    = alerts.filter(a => a.level === "medium").length
  const systemLabel = highCount > 0 ? "critical" : medCount > 0 ? "warning" : "good"
  const statusColor = highCount > 0 ? "#dc2626" : medCount > 0 ? "#d97706" : "#16a34a"
  const statusBg    = highCount > 0 ? "#fef2f2" : medCount > 0 ? "#fffbeb" : "#f0fdf4"
  const statusBorder = highCount > 0 ? "#fecaca" : medCount > 0 ? "#fde68a" : "#86efac"
  const statusTextColor = highCount > 0 ? "#7f1d1d" : medCount > 0 ? "#78350f" : "#14532d"

  const aiSummary =
    `System status: ${systemLabel}. ` +
    `Top workers: ${topWorkers.length}. ` +
    `Risk workers: ${riskWorkers.length}. ` +
    `Bonus total: ${totalBonus.toLocaleString()} XAF. ` +
    `Salary increase total: ${totalIncrease.toLocaleString()} XAF. ` +
    (highCount > 0 ? `${highCount} critical alert${highCount > 1 ? "s" : ""} require immediate action.` : "No critical issues detected.")

  return (
    <div style={{ padding: "32px", fontFamily: "Arial, sans-serif", color: "#111", maxWidth: "960px" }}>

      <h1 style={{ margin: "0 0 4px", fontSize: "24px" }}>AI Management Alerts</h1>
      <p style={{ margin: "0 0 24px", color: "#666", fontSize: "13px" }}>
        PeopleOS — Live AI alerts · {alerts.length} active notification{alerts.length !== 1 ? "s" : ""}
      </p>

      {/* System status banner */}
      <div style={{
        background: statusBg,
        border: `1px solid ${statusBorder}`,
        borderLeft: `4px solid ${statusColor}`,
        borderRadius: "8px",
        padding: "14px 18px",
        marginBottom: "28px",
        fontSize: "13px",
        color: statusTextColor,
        lineHeight: "1.6",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <span style={{
            background: statusColor, color: "white",
            fontWeight: 700, fontSize: "11px",
            padding: "2px 10px", borderRadius: "20px",
            textTransform: "uppercase", letterSpacing: "0.5px",
          }}>
            {systemLabel}
          </span>
          <span><strong>AI Insight: </strong>{aiSummary}</span>
        </div>
      </div>

      {/* Summary pills */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "28px" }}>
        {(["high", "medium", "low"] as AlertLevel[]).map(level => {
          const count = alerts.filter(a => a.level === level).length
          const s = LEVEL_STYLE[level]
          return (
            <div key={level} style={{
              background: s.bg, border: `1px solid ${s.border}`,
              borderRadius: "8px", padding: "10px 20px",
              display: "flex", flexDirection: "column", alignItems: "center", minWidth: "90px",
            }}>
              <div style={{ fontSize: "20px", fontWeight: 700, color: s.badge }}>{count}</div>
              <div style={{ fontSize: "11px", color: s.text, textTransform: "capitalize", fontWeight: 600 }}>{level} priority</div>
            </div>
          )
        })}
        <div style={{
          background: "#f9fafb", border: "1px solid #e5e7eb",
          borderRadius: "8px", padding: "10px 20px",
          display: "flex", flexDirection: "column", alignItems: "center", minWidth: "90px",
        }}>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "#555" }}>{alerts.length}</div>
          <div style={{ fontSize: "11px", color: "#888", fontWeight: 600 }}>Total alerts</div>
        </div>
      </div>

      {/* Alert cards */}
      {alerts.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "60px 0",
          color: "#16a34a", fontSize: "15px", fontWeight: 600,
        }}>
          No alerts. System is healthy.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {alerts.map((alert, i) => {
            const s = LEVEL_STYLE[alert.level]
            return (
              <div key={i} style={{
                background: s.bg,
                border: `1px solid ${s.border}`,
                borderLeft: `4px solid ${s.badge}`,
                borderRadius: "8px",
                padding: "14px 18px",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>

                  {/* Icon + level badge */}
                  <div style={{ flexShrink: 0, marginTop: "1px" }}>
                    <span style={{ fontSize: "18px" }}>{TYPE_ICON[alert.type]}</span>
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                      <span style={{ fontWeight: 700, fontSize: "13px", color: s.text }}>{alert.message}</span>
                      <span style={{
                        background: s.badge, color: "white",
                        fontSize: "10px", fontWeight: 700,
                        padding: "1px 8px", borderRadius: "20px",
                        textTransform: "uppercase", letterSpacing: "0.4px",
                      }}>
                        {alert.level}
                      </span>
                      <span style={{
                        background: "rgba(0,0,0,0.07)", color: s.text,
                        fontSize: "10px", fontWeight: 600,
                        padding: "1px 8px", borderRadius: "20px",
                        textTransform: "capitalize",
                      }}>
                        {alert.type}
                      </span>
                    </div>
                    {alert.detail && (
                      <div style={{ fontSize: "12px", color: s.text, opacity: 0.85, lineHeight: "1.5" }}>
                        {alert.detail}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
