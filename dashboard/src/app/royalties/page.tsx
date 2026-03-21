import { prisma }      from "@/lib/db"
import { S, row, statusBadge } from "@/lib/ui"

export const dynamic = "force-dynamic"

export default async function RoyaltiesPage() {
  const royalties = await prisma.royalty.findMany({ orderBy: { date: "desc" } })

  const unpaidTotal = royalties.filter(r => r.status === "unpaid").reduce((s, r) => s + Number(r.amount), 0)
  const paidTotal   = royalties.filter(r => r.status === "paid").reduce((s, r)   => s + Number(r.amount), 0)
  const unpaidCount = royalties.filter(r => r.status === "unpaid").length

  return (
    <div style={S.page}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={S.heading}>Royalties</h1>
          <p style={S.subtitle}>Author royalty tracking — global (not company-scoped)</p>
        </div>
        <a href="/import?module=royalties" style={{ border: "1px solid #2563eb", color: "#2563eb", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 600, textDecoration: "none", flexShrink: 0, marginTop: 4 }}>↑ Import</a>
      </div>

      <div style={S.statBar}>
        <div style={S.statCard}><div style={S.statValue}>{royalties.length}</div><div style={S.statLabel}>Total Records</div></div>
        <div style={S.statCard}><div style={{ ...S.statValue, color: "#ef4444" }}>{unpaidTotal.toLocaleString()}</div><div style={S.statLabel}>Unpaid (XAF)</div></div>
        <div style={S.statCard}><div style={{ ...S.statValue, color: "#16a34a" }}>{paidTotal.toLocaleString()}</div><div style={S.statLabel}>Paid (XAF)</div></div>
        <div style={S.statCard}><div style={{ ...S.statValue, color: "#f97316" }}>{unpaidCount}</div><div style={S.statLabel}>Unpaid Items</div></div>
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
                  <td style={S.td}><span style={statusBadge(r.status)}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
