import { prisma } from "@/lib/db"
import { S, row } from "@/lib/ui"

export const dynamic = "force-dynamic"

export default async function AuthorsPage() {
  const authors = await prisma.author.findMany({ orderBy: { name: "asc" } })

  return (
    <div style={S.page}>
      <h1 style={S.heading}>Authors</h1>
      <p style={S.subtitle}>Author registry — global, not company-scoped</p>

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
