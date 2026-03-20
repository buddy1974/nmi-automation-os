import { cookies }    from "next/headers"
import { redirect }   from "next/navigation"
import { prisma }     from "@/lib/db"
import { getSession } from "@/lib/auth"
import { S, row }     from "@/lib/ui"

export const dynamic = "force-dynamic"

const ALLOWED = ["admin", "owner"]

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number): string { return n.toLocaleString() }

function KpiCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent: string }) {
  return (
    <div style={S.kpiCard(accent)}>
      <div style={{ fontSize: "11px", color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>{label}</div>
      <div style={{ fontSize: "26px", fontWeight: 700, color: accent }}>{value}</div>
      {sub && <div style={{ fontSize: "12px", color: "#999", marginTop: "4px" }}>{sub}</div>}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function OwnerPage() {
  const jar     = await cookies()
  const session = await getSession(jar.get("nmi_session")?.value)
  if (!session || !ALLOWED.includes(session.role)) redirect("/dashboard")

  // ── Global aggregates ─────────────────────────────────────────────────────

  const [
    revenueAgg,
    orderCount,
    activeWorkerCount,
    companies,
    workers,
    lowStockProducts,
    unpaidRoyalties,
    printReadyManuscripts,
    performanceRecords,
  ] = await Promise.all([
    prisma.order.aggregate({ _sum: { total: true } }),
    prisma.order.count(),
    prisma.worker.count({ where: { status: "active" } }),
    prisma.company.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.worker.findMany({
      where:  { status: "active" },
      select: { id: true, name: true, cnpsNumber: true, contractType: true, salaryBase: true, companyId: true },
    }),
    prisma.product.findMany({
      where:  { stock: { lt: 10 } },
      select: { code: true, title: true, stock: true },
    }),
    prisma.royalty.findMany({
      where:  { status: "unpaid" },
      select: { id: true, author: true, book: true, amount: true },
    }),
    prisma.manuscript.findMany({
      where:  { readyForPrint: true },
      select: { id: true, title: true, author: true },
    }),
    prisma.performanceRecord.findMany({
      select: { workerId: true, scorePercent: true, totalScore: true },
    }),
  ])

  const totalRevenue   = Number(revenueAgg._sum.total ?? 0)
  const activeCompanyCount = companies.length

  // ── Per-company breakdown ─────────────────────────────────────────────────

  const companyBreakdown = await Promise.all(
    companies.map(async c => {
      const [rev, orders, workerCnt] = await Promise.all([
        prisma.order.aggregate({ _sum: { total: true }, where: { companyId: c.id } }),
        prisma.order.count({ where: { companyId: c.id } }),
        prisma.worker.count({ where: { companyId: c.id, status: "active" } }),
      ])
      const revenue = Number(rev._sum.total ?? 0)
      return { id: c.id, name: c.name, city: c.city, revenue, orders, workers: workerCnt }
    })
  )

  // ── AI Decisions (system-generated recommendations) ───────────────────────

  type Decision = { severity: "high" | "medium" | "low"; message: string }
  const decisions: Decision[] = []

  // Low stock
  for (const p of lowStockProducts) {
    decisions.push({
      severity: p.stock === 0 ? "high" : "medium",
      message:  `Low stock: ${p.code} — ${p.title} (${p.stock} units remaining)`,
    })
  }

  // Unpaid royalties
  if (unpaidRoyalties.length > 0) {
    const total = unpaidRoyalties.reduce((s, r) => s + Number(r.amount), 0)
    decisions.push({
      severity: "medium",
      message:  `${unpaidRoyalties.length} unpaid royalties totalling ${fmt(total)} XAF`,
    })
  }

  // Missing CNPS
  const missingCnps = workers.filter(w => !w.cnpsNumber && ["CDI", "CDD"].includes(w.contractType))
  for (const w of missingCnps) {
    decisions.push({
      severity: "high",
      message:  `Missing CNPS: ${w.name} (${w.contractType}) — required for compliance`,
    })
  }

  // Low performers (scorePercent < 50)
  const latestPerf = new Map<number, number>()
  for (const r of performanceRecords) {
    if (!latestPerf.has(r.workerId)) latestPerf.set(r.workerId, r.scorePercent)
  }
  const lowPerformers = [...latestPerf.entries()].filter(([, pct]) => pct < 50)
  if (lowPerformers.length > 0) {
    decisions.push({
      severity: "medium",
      message:  `${lowPerformers.length} worker${lowPerformers.length !== 1 ? "s" : ""} with performance below 50%`,
    })
  }

  // Manuscripts ready to print
  for (const m of printReadyManuscripts) {
    decisions.push({
      severity: "low",
      message:  `Ready to print: "${m.title}" by ${m.author || "unknown"}`,
    })
  }

  // Sort: high → medium → low
  const ORDER = { high: 0, medium: 1, low: 2 }
  decisions.sort((a, b) => ORDER[a.severity] - ORDER[b.severity])

  const severityColor: Record<string, string> = {
    high:   "#dc2626",
    medium: "#d97706",
    low:    "#2563eb",
  }

  return (
    <div style={S.page}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}

      <h1 style={S.heading}>Owner Intelligence Dashboard</h1>
      <p style={S.subtitle}>
        Real-time command centre — {activeCompanyCount} active compan{activeCompanyCount !== 1 ? "ies" : "y"} · {fmt(orderCount)} total orders
      </p>


      {/* ── KPI Row ────────────────────────────────────────────────────────── */}

      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "36px" }}>
        <KpiCard label="Total Revenue"      value={`${fmt(totalRevenue)} XAF`} sub="all companies, all time" accent="#16a34a" />
        <KpiCard label="Total Orders"       value={fmt(orderCount)}             sub="all companies"           accent="#2563eb" />
        <KpiCard label="Active Workers"     value={fmt(activeWorkerCount)}      sub="status = active"         accent="#7c3aed" />
        <KpiCard label="Active Companies"   value={fmt(activeCompanyCount)}     sub="in the system"           accent="#d97706" />
      </div>


      {/* ── AI Decisions ───────────────────────────────────────────────────── */}

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
              border:       "1px solid #e5e7eb",
              borderLeft:   `4px solid ${severityColor[d.severity]}`,
              borderRadius: "6px",
              padding:      "10px 14px",
              marginBottom: "6px",
              fontSize:     "13px",
            }}>
              <span style={S.badge(severityColor[d.severity])}>{d.severity}</span>
              <span>{d.message}</span>
            </div>
          ))}
        </div>
      )}


      {/* ── Company Breakdown ──────────────────────────────────────────────── */}

      <h2 style={S.sectionTitle}>Company Breakdown</h2>

      {companyBreakdown.length === 0 ? (
        <p style={S.mutedText}>No companies found. Create companies in the Owner section.</p>
      ) : (
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>
                {["Company", "City", "Orders", "Revenue (XAF)", "Active Workers"].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
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


      {/* ── Performance Intel (from existing owner data) ───────────────────── */}

      {performanceRecords.length > 0 && (
        <>
          <h2 style={S.sectionTitle}>Performance Intel</h2>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {[
              { label: "Evaluations",     value: performanceRecords.length,                                   accent: "#2563eb" },
              { label: "Low performers",  value: lowPerformers.length,                                         accent: "#dc2626" },
              { label: "Avg score",       value: `${Math.round(performanceRecords.reduce((s,r) => s + r.scorePercent, 0) / performanceRecords.length)}%`, accent: "#7c3aed" },
              { label: "High performers", value: performanceRecords.filter(r => r.scorePercent >= 80).length,  accent: "#16a34a" },
            ].map(k => (
              <div key={k.label} style={S.kpiCard(k.accent)}>
                <div style={{ fontSize: "11px", color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>{k.label}</div>
                <div style={{ fontSize: "22px", fontWeight: 700, color: k.accent }}>{k.value}</div>
              </div>
            ))}
          </div>
        </>
      )}

    </div>
  )
}
