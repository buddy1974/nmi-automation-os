import { cookies }    from "next/headers"
import { redirect }   from "next/navigation"
import { prisma }     from "@/lib/db"
import { getSession } from "@/lib/auth"
import { S, row, badge } from "@/lib/ui"
import OwnerCharts, { type CompanyChartData, type MonthlyChartData } from "@/app/components/OwnerCharts"
import PrintButton  from "@/app/components/PrintButton"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Owner Intelligence — NMI Automation OS" }

const ALLOWED = ["admin", "owner"]

function fmt(n: number): string { return n.toLocaleString() }

function KpiCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent: string }) {
  return (
    <div style={S.kpiCard(accent)}>
      <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>{label}</div>
      <div style={{ fontSize: "28px", fontWeight: 700, color: accent }}>{value}</div>
      {sub && <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>{sub}</div>}
    </div>
  )
}

export default async function OwnerPage() {
  const jar     = await cookies()
  const session = await getSession(jar.get("nmi_session")?.value)
  if (!session || !ALLOWED.includes(session.role)) redirect("/dashboard")

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
  sixMonthsAgo.setDate(1)
  sixMonthsAgo.setHours(0, 0, 0, 0)

  const [
    revenueAgg, orderCount, activeWorkerCount, companies, workers,
    lowStockProducts, unpaidRoyalties, printReadyManuscripts, performanceRecords,
    recentOrders,
  ] = await Promise.all([
    prisma.order.aggregate({ _sum: { total: true } }),
    prisma.order.count(),
    prisma.worker.count({ where: { status: "active" } }),
    prisma.company.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.worker.findMany({
      where:  { status: "active" },
      select: { id: true, name: true, cnpsNumber: true, contractType: true, salaryBase: true, companyId: true },
    }),
    prisma.product.findMany({ where: { stock: { lt: 10 } }, select: { code: true, title: true, stock: true } }),
    prisma.royalty.findMany({ where: { status: "unpaid" }, select: { id: true, author: true, book: true, amount: true } }),
    prisma.manuscript.findMany({ where: { readyForPrint: true }, select: { id: true, title: true, author: true } }),
    prisma.performanceRecord.findMany({ select: { workerId: true, scorePercent: true, totalScore: true } }),
    prisma.order.findMany({
      where:  { date: { gte: sixMonthsAgo } },
      select: { date: true, total: true },
    }),
  ])

  // Build 6-month revenue trend (fill missing months with 0)
  const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  const monthMap = new Map<string, number>()
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    monthMap.set(key, 0)
  }
  for (const o of recentOrders) {
    const d   = new Date(o.date)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (monthMap.has(key)) monthMap.set(key, (monthMap.get(key) ?? 0) + Number(o.total))
  }
  const monthlyRevenue: MonthlyChartData[] = [...monthMap.entries()].map(([key, amount]) => {
    const [year, month] = key.split("-").map(Number)
    return { month: `${MONTH_NAMES[month]} ${String(year).slice(2)}`, amount }
  })

  const totalRevenue       = Number(revenueAgg._sum.total ?? 0)
  const activeCompanyCount = companies.length

  const companyBreakdown = await Promise.all(
    companies.map(async c => {
      const [rev, orders, workerCnt] = await Promise.all([
        prisma.order.aggregate({ _sum: { total: true }, where: { companyId: c.id } }),
        prisma.order.count({ where: { companyId: c.id } }),
        prisma.worker.count({ where: { companyId: c.id, status: "active" } }),
      ])
      return { id: c.id, name: c.name, city: c.city, revenue: Number(rev._sum.total ?? 0), orders, workers: workerCnt }
    })
  )

  const chartCompanies: CompanyChartData[] = companyBreakdown.map(c => ({
    name: c.name, revenue: c.revenue, orders: c.orders, workers: c.workers,
  }))

  type Decision = { severity: "high" | "medium" | "low"; message: string }
  const decisions: Decision[] = []

  for (const p of lowStockProducts) {
    decisions.push({ severity: p.stock === 0 ? "high" : "medium", message: `Low stock: ${p.code} — ${p.title} (${p.stock} units remaining)` })
  }
  if (unpaidRoyalties.length > 0) {
    const total = unpaidRoyalties.reduce((s, r) => s + Number(r.amount), 0)
    decisions.push({ severity: "medium", message: `${unpaidRoyalties.length} unpaid royalties totalling ${fmt(total)} XAF` })
  }
  const missingCnps = workers.filter(w => !w.cnpsNumber && ["CDI", "CDD"].includes(w.contractType))
  for (const w of missingCnps) {
    decisions.push({ severity: "high", message: `Missing CNPS: ${w.name} (${w.contractType}) — required for compliance` })
  }
  const latestPerf = new Map<number, number>()
  for (const r of performanceRecords) {
    if (!latestPerf.has(r.workerId)) latestPerf.set(r.workerId, r.scorePercent)
  }
  const lowPerformers = [...latestPerf.entries()].filter(([, pct]) => pct < 50)
  if (lowPerformers.length > 0) {
    decisions.push({ severity: "medium", message: `${lowPerformers.length} worker${lowPerformers.length !== 1 ? "s" : ""} with performance below 50%` })
  }
  for (const m of printReadyManuscripts) {
    decisions.push({ severity: "low", message: `Ready to print: "${m.title}" by ${m.author || "unknown"}` })
  }

  const ORDER = { high: 0, medium: 1, low: 2 }
  decisions.sort((a, b) => ORDER[a.severity] - ORDER[b.severity])

  return (
    <div style={S.page}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <h1 style={{ ...S.heading, margin: 0 }}>Owner Intelligence Dashboard</h1>
        <PrintButton />
      </div>
      <p style={S.subtitle}>
        Real-time command centre — {activeCompanyCount} active compan{activeCompanyCount !== 1 ? "ies" : "y"} · {fmt(orderCount)} total orders
      </p>

      {/* ── KPI Row ──────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "36px" }}>
        <KpiCard label="Total Revenue"    value={`${fmt(totalRevenue)} XAF`} sub="all companies, all time" accent="#16a34a" />
        <KpiCard label="Total Orders"     value={fmt(orderCount)}            sub="all companies"           accent="#2563eb" />
        <KpiCard label="Active Workers"   value={fmt(activeWorkerCount)}     sub="status = active"         accent="#7c3aed" />
        <KpiCard label="Active Companies" value={fmt(activeCompanyCount)}    sub="in the system"           accent="#f97316" />
      </div>

      {/* ── Analytics Charts ─────────────────────────────────────────────────── */}
      <OwnerCharts companies={chartCompanies} monthlyRevenue={monthlyRevenue} />

      {/* ── AI Decisions ─────────────────────────────────────────────────────── */}
      <h2 style={S.sectionTitle}>AI Decisions &amp; Alerts ({decisions.length})</h2>
      {decisions.length === 0 ? (
        <p style={S.successText}>✓ No issues detected — system is healthy</p>
      ) : (
        <div style={{ marginBottom: "32px" }}>
          {decisions.map((d, i) => (
            <div key={i} style={{
              display:      "flex",
              alignItems:   "flex-start",
              gap:          "12px",
              background:   "#fff",
              border:       "1px solid #e2e8f0",
              borderLeft:   `4px solid ${d.severity === "high" ? "#ef4444" : d.severity === "medium" ? "#f97316" : "#2563eb"}`,
              borderRadius: "6px",
              padding:      "10px 14px",
              marginBottom: "6px",
              fontSize:     "13px",
            }}>
              <span style={badge(d.severity === "high" ? "red" : d.severity === "medium" ? "orange" : "blue")}>{d.severity}</span>
              <span>{d.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Company Breakdown ────────────────────────────────────────────────── */}
      <h2 style={S.sectionTitle}>Company Breakdown</h2>
      {companyBreakdown.length === 0 ? (
        <p style={S.mutedText}>No companies found.</p>
      ) : (
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>{["Company","City","Orders","Revenue (XAF)","Active Workers"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {companyBreakdown.map((c, i) => (
                <tr key={c.id} style={row(i)}>
                  <td style={{ ...S.td, fontWeight: 600 }}>{c.name}</td>
                  <td style={S.td}>{c.city || "—"}</td>
                  <td style={S.td}>{c.orders}</td>
                  <td style={{ ...S.td, fontWeight: 600, color: "#16a34a" }}>{fmt(c.revenue)}</td>
                  <td style={S.td}>{c.workers}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: "#f1f5f9", fontWeight: 700, borderTop: "2px solid #e2e8f0" }}>
                <td style={S.td} colSpan={2}>TOTAL</td>
                <td style={S.td}>{fmt(orderCount)}</td>
                <td style={{ ...S.td, color: "#16a34a" }}>{fmt(totalRevenue)}</td>
                <td style={S.td}>{fmt(activeWorkerCount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* ── Performance Intel ────────────────────────────────────────────────── */}
      {performanceRecords.length > 0 && (
        <>
          <h2 style={S.sectionTitle}>Performance Intel</h2>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            {[
              { label: "Evaluations",     value: performanceRecords.length,                                                                                          accent: "#2563eb" },
              { label: "Low performers",  value: lowPerformers.length,                                                                                              accent: "#ef4444" },
              { label: "Avg score",       value: `${Math.round(performanceRecords.reduce((s, r) => s + r.scorePercent, 0) / performanceRecords.length)}%`,           accent: "#7c3aed" },
              { label: "High performers", value: performanceRecords.filter(r => r.scorePercent >= 80).length,                                                        accent: "#16a34a" },
            ].map(k => (
              <div key={k.label} style={S.kpiCard(k.accent)}>
                <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>{k.label}</div>
                <div style={{ fontSize: "24px", fontWeight: 700, color: k.accent }}>{k.value}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
