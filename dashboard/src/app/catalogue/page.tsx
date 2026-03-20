import { prisma }        from "@/lib/db"
import { S, row, badge } from "@/lib/ui"

export const dynamic = "force-dynamic"

export default async function CataloguePage() {
  const products = await prisma.product.findMany({ orderBy: { code: "asc" } })

  const totalStock = products.reduce((s, p) => s + p.stock, 0)
  const lowStock   = products.filter(p => p.stock < 10).length

  return (
    <div style={S.page}>
      <h1 style={S.heading}>Catalogue</h1>
      <p style={S.subtitle}>Full product catalogue — {products.length} titles</p>

      <div style={S.statBar}>
        <div style={S.statCard}><div style={S.statValue}>{products.length}</div><div style={S.statLabel}>Total Titles</div></div>
        <div style={S.statCard}><div style={S.statValue}>{totalStock.toLocaleString()}</div><div style={S.statLabel}>Total Stock Units</div></div>
        <div style={S.statCard}><div style={{ ...S.statValue, color: "#f97316" }}>{lowStock}</div><div style={S.statLabel}>Low Stock (&lt;10)</div></div>
      </div>

      {products.length === 0 ? (
        <p style={S.mutedText}>No products found</p>
      ) : (
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>
                {["Code","Title","Subject","Level","Class","Price (XAF)","Stock"].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <tr key={p.id} style={row(i)}>
                  <td style={{ ...S.td, fontWeight: 600, color: "#2563eb" }}>{p.code}</td>
                  <td style={S.td}>{p.title}</td>
                  <td style={S.td}>{p.subject || "—"}</td>
                  <td style={S.td}>{p.level}</td>
                  <td style={S.td}>{p.class || "—"}</td>
                  <td style={S.td}>{Number(p.price).toLocaleString()}</td>
                  <td style={S.td}>
                    <span style={badge(p.stock === 0 ? "red" : p.stock < 10 ? "orange" : "green")}>
                      {p.stock}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
