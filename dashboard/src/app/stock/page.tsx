import { prisma }      from "@/lib/db"
import { S, row, badge } from "@/lib/ui"

export const dynamic = "force-dynamic"

export default async function StockPage() {
  const products = await prisma.product.findMany({
    orderBy: { code: "asc" },
    include: { stockHistory: { orderBy: { createdAt: "desc" }, take: 3 } },
  })

  const totalUnits = products.reduce((s, p) => s + p.stock, 0)
  const lowCount   = products.filter(p => p.stock < 10).length
  const zeroCount  = products.filter(p => p.stock === 0).length

  return (
    <div style={S.page}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={S.heading}>Stock</h1>
          <p style={S.subtitle}>Book inventory across all titles — live from DB</p>
        </div>
        <a href="/import?module=products" style={{ border: "1px solid #1a73e8", color: "#1a73e8", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 600, textDecoration: "none", flexShrink: 0, marginTop: 4 }}>↑ Import</a>
      </div>

      <div style={S.statBar}>
        <div style={S.statCard}><div style={S.statValue}>{products.length}</div><div style={S.statLabel}>Total Titles</div></div>
        <div style={S.statCard}><div style={S.statValue}>{totalUnits.toLocaleString()}</div><div style={S.statLabel}>Total Units</div></div>
        <div style={S.statCard}><div style={{ ...S.statValue, color: "#f97316" }}>{lowCount}</div><div style={S.statLabel}>Low Stock (&lt;10)</div></div>
        <div style={S.statCard}><div style={{ ...S.statValue, color: "#ef4444" }}>{zeroCount}</div><div style={S.statLabel}>Out of Stock</div></div>
      </div>

      <div style={S.tableWrap}>
        <table style={S.table}>
          <thead>
            <tr>{["Code","Title","Subject","Level","Stock","Recent Movements"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {products.map((p, i) => (
              <tr key={p.id} style={row(i)}>
                <td style={{ ...S.td, fontWeight: 600, color: "#1a73e8" }}>{p.code}</td>
                <td style={S.td}>{p.title}</td>
                <td style={S.td}>{p.subject || "—"}</td>
                <td style={S.td}>{p.level}</td>
                <td style={S.td}>
                  <span style={badge(p.stock === 0 ? "red" : p.stock < 10 ? "orange" : "green")}>
                    {p.stock}
                  </span>
                </td>
                <td style={S.td}>
                  {p.stockHistory.length === 0 ? (
                    <span style={S.mutedText}>—</span>
                  ) : (
                    p.stockHistory.map(h => (
                      <div key={h.id} style={{ fontSize: "12px", marginBottom: "2px" }}>
                        <span style={{ color: h.change > 0 ? "#16a34a" : "#ef4444", fontWeight: 700 }}>
                          {h.change > 0 ? "+" : ""}{h.change}
                        </span>
                        {" "}<span style={S.mutedText}>{h.reason}</span>
                        {" "}<span style={{ color: "#94a3b8", fontSize: "11px" }}>{new Date(h.createdAt).toLocaleDateString()}</span>
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
