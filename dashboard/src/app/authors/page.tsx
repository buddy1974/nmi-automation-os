import { prisma } from "@/lib/db"
import { S, row } from "@/lib/ui"

export const dynamic = "force-dynamic"

export default async function AuthorsPage() {
  const authors = await prisma.author.findMany({ orderBy: { name: "asc" } })

  return (
    <div style={S.page}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={S.heading}>Authors</h1>
          <p style={S.subtitle}>Author registry — global, not company-scoped</p>
        </div>
        <a href="/import?module=authors" style={{ border: "1px solid #1a73e8", color: "#1a73e8", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 600, textDecoration: "none", flexShrink: 0, marginTop: 4 }}>↑ Import</a>
      </div>

      <div style={S.statBar}>
        <div style={S.statCard}><div style={S.statLabel}>Total Authors</div><div style={S.statValue}>{authors.length}</div></div>
      </div>

      {authors.length === 0 ? <p style={S.mutedText}>No authors recorded</p> : (
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead><tr>{["Name","Phone","Email"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {authors.map((a, i) => (
                <tr key={a.id} style={row(i)}>
                  <td style={{ ...S.td, fontWeight: 600 }}>{a.name}</td>
                  <td style={S.td}>{a.phone || "—"}</td>
                  <td style={S.td}>{a.email || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
