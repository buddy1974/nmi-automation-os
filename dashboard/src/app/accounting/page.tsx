import { cookies }    from "next/headers"
import { prisma }     from "@/lib/db"
import { getSession } from "@/lib/auth"
import { resolveCompany, directFilter } from "@/lib/companyFilter"
import { S, row }     from "@/lib/ui"

export const dynamic = "force-dynamic"

export default async function AccountingPage() {
  const jar     = await cookies()
  const session = await getSession(jar.get("nmi_session")?.value)
  const cid     = session ? resolveCompany(session, jar.get("nmi_company")?.value) : undefined

  const [costs, royalties, revenueAgg] = await Promise.all([
    prisma.costRecord.findMany({ orderBy: { date: "desc" } }),
    prisma.royalty.findMany({ orderBy: { date: "desc" } }),
    prisma.order.aggregate({ _sum: { total: true }, where: directFilter(cid) }),
  ])

  const totalRevenue   = Number(revenueAgg._sum.total ?? 0)
  const totalCosts     = costs.reduce((s, c) => s + Number(c.amount), 0)
  const totalRoyalties = royalties.reduce((s, r) => s + Number(r.amount), 0)
  const totalProfit    = totalRevenue - totalCosts - totalRoyalties

  return (
    <div style={S.page}>
      <h1 style={S.heading}>Accounting</h1>
      <p style={S.subtitle}>Revenue, costs, royalties and profit — company-scoped revenue</p>

      {/* ── Global Report ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "32px" }}>
        {[
          { label: "Revenue (XAF)",   value: totalRevenue,   color: "#16a34a" },
          { label: "Costs (XAF)",     value: totalCosts,     color: "#dc2626" },
          { label: "Royalties (XAF)", value: totalRoyalties, color: "#d97706" },
          { label: "Profit (XAF)",    value: totalProfit,    color: totalProfit >= 0 ? "#16a34a" : "#dc2626" },
        ].map(k => (
          <div key={k.label} style={{ ...S.kpiCard(k.color), flex: "1 1 160px" }}>
            <div style={{ fontSize: "11px", color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>{k.label}</div>
            <div style={{ fontSize: "22px", fontWeight: 700, color: k.color }}>{k.value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* ── Costs ─────────────────────────────────────────────────────────── */}
      <h2 style={S.sectionTitle}>Costs ({costs.length})</h2>
      {costs.length === 0 ? <p style={S.mutedText}>No costs recorded</p> : (
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead><tr>{["Book","Type","Amount (XAF)","Date","Notes"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {costs.map((c, i) => (
                <tr key={c.id} style={row(i)}>
                  <td style={{ ...S.td, fontWeight: 600 }}>{c.book || "—"}</td>
                  <td style={S.td}><span style={S.badge("#64748b")}>{c.type}</span></td>
                  <td style={{ ...S.td, color: "#dc2626", fontWeight: 600 }}>{Number(c.amount).toLocaleString()}</td>
                  <td style={{ ...S.td, ...S.mutedText }}>{new Date(c.date).toLocaleDateString()}</td>
                  <td style={S.td}>{c.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Royalties ─────────────────────────────────────────────────────── */}
      <h2 style={S.sectionTitle}>Royalties ({royalties.length})</h2>
      {royalties.length === 0 ? <p style={S.mutedText}>No royalties recorded</p> : (
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead><tr>{["Author","Book","Amount (XAF)","Date","Status"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {royalties.map((r, i) => (
                <tr key={r.id} style={row(i)}>
                  <td style={{ ...S.td, fontWeight: 600 }}>{r.author}</td>
                  <td style={S.td}>{r.book || "—"}</td>
                  <td style={S.td}>{Number(r.amount).toLocaleString()}</td>
                  <td style={{ ...S.td, ...S.mutedText }}>{new Date(r.date).toLocaleDateString()}</td>
                  <td style={S.td}><span style={S.badge(r.status === "paid" ? "#16a34a" : "#dc2626")}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
