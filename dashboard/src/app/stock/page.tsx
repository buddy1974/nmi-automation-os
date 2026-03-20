import { prisma } from "@/lib/db"
import { S, row } from "@/lib/ui"

export const dynamic = "force-dynamic"

export default async function StockPage() {
  const products = await prisma.product.findMany({
    orderBy: { code: "asc" },
    include: { stockHistory: { orderBy: { createdAt: "desc" }, take: 3 } },
  })

  const totalUnits  = products.reduce((s, p) => s + p.stock, 0)
  const lowCount    = products.filter(p => p.stock < 10).length
  const zeroCount   = products.filter(p => p.stock === 0).length

  return (
    <div style={S.page}>
      <h1 style={S.heading}>Stock</h1>
      <p style={S.subtitle}>Book inventory across all titles — live from DB</p>

      <div style={S.statBar}>
        <div style={S.statCard}><div style={S.statLabel}>Total Titles</div><div style={S.statValue}>{products.length}</div></div>
        <div style={S.statCard}><div style={S.statLabel}>Total Units</div><div style={S.statValue}>{totalUnits.toLocaleString()}</div></div>
        <div style={S.statCard}><div style={S.statLabel}>Low Stock (&lt;10)</div><div style={{ ...S.statValue, color: "#d97706" }}>{lowCount}</div></div>
        <div style={S.statCard}><div style={S.statLabel}>Out of Stock</div><div style={{ ...S.statValue, color: "#dc2626" }}>{zeroCount}</div></div>
      </div>

      <div style={S.tableWrap}>
        <table style={S.table}>
          <thead>
            <tr>{["Code","Title","Subject","Level","Stock","Recent Movements"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {products.map((p, i) => (
              <tr key={p.id} style={row(i)}>
                <td style={{ ...S.td, fontWeight: 600 }}>{p.code}</td>
                <td style={S.td}>{p.title}</td>
                <td style={S.td}>{p.subject || "—"}</td>
                <td style={S.td}>{p.level}</td>
                <td style={S.td}>
                  <span style={S.badge(p.stock === 0 ? "#dc2626" : p.stock < 10 ? "#d97706" : "#16a34a")}>
                    {p.stock}
                  </span>
                </td>
                <td style={S.td}>
                  {p.stockHistory.length === 0 ? (
                    <span style={S.mutedText}>—</span>
                  ) : (
                    p.stockHistory.map(h => (
                      <div key={h.id} style={{ fontSize: "12px", marginBottom: "2px" }}>
                        <span style={{ color: h.change > 0 ? "#16a34a" : "#dc2626", fontWeight: 700 }}>
                          {h.change > 0 ? "+" : ""}{h.change}
                        </span>
                        {" "}<span style={S.mutedText}>{h.reason}</span>
                        {" "}<span style={{ color: "#cbd5e1", fontSize: "11px" }}>{new Date(h.createdAt).toLocaleDateString()}</span>
                      </div>
                    ))
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
