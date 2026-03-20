import { prisma } from "@/lib/db"
import { S, row } from "@/lib/ui"

export const dynamic = "force-dynamic"

export default async function RoyaltiesPage() {
  const royalties = await prisma.royalty.findMany({ orderBy: { date: "desc" } })

  const unpaidTotal = royalties.filter(r => r.status === "unpaid").reduce((s, r) => s + Number(r.amount), 0)
  const paidTotal   = royalties.filter(r => r.status === "paid").reduce((s, r)   => s + Number(r.amount), 0)
  const unpaidCount = royalties.filter(r => r.status === "unpaid").length

  return (
    <div style={S.page}>
      <h1 style={S.heading}>Royalties</h1>
      <p style={S.subtitle}>Author royalty tracking — global (not company-scoped)</p>

      <div style={S.statBar}>
        <div style={S.statCard}><div style={S.statLabel}>Total Records</div><div style={S.statValue}>{royalties.length}</div></div>
        <div style={S.statCard}><div style={S.statLabel}>Unpaid (XAF)</div><div style={{ ...S.statValue, color: "#dc2626" }}>{unpaidTotal.toLocaleString()}</div></div>
        <div style={S.statCard}><div style={S.statLabel}>Paid (XAF)</div><div style={{ ...S.statValue, color: "#16a34a" }}>{paidTotal.toLocaleString()}</div></div>
        <div style={S.statCard}><div style={S.statLabel}>Unpaid Items</div><div style={{ ...S.statValue, color: "#d97706" }}>{unpaidCount}</div></div>
      </div>

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
