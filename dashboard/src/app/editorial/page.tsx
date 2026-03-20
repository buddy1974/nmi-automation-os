import { prisma }      from "@/lib/db"
import { S, row, statusBadge } from "@/lib/ui"

export const dynamic = "force-dynamic"

export default async function EditorialPage() {
  const [manuscripts, authors, royalties] = await Promise.all([
    prisma.manuscript.findMany({ orderBy: { date: "desc" } }),
    prisma.author.findMany({ orderBy: { name: "asc" } }),
    prisma.royalty.findMany({ orderBy: { date: "desc" } }),
  ])

  const unpaidRoyalties    = royalties.filter(r => r.status === "unpaid")
  const totalRoyaltiesOwed = unpaidRoyalties.reduce((s, r) => s + Number(r.amount), 0)

  const authorStats = authors.map(a => {
    const ar       = royalties.filter(r => r.author === a.name)
    const totalOwed = ar.filter(r => r.status === "unpaid").reduce((s, r) => s + Number(r.amount), 0)
    const bookCount = new Set(ar.map(r => r.book).filter(Boolean)).size
    return { ...a, bookCount, totalOwed }
  })

  return (
    <div style={S.page}>
      <h1 style={S.heading}>Editorial Hub</h1>
      <p style={S.subtitle}>Manuscripts, authors and royalties — global editorial pipeline</p>

      <div style={S.statBar}>
        <div style={S.statCard}><div style={S.statValue}>{manuscripts.length}</div><div style={S.statLabel}>Manuscripts</div></div>
        <div style={S.statCard}><div style={S.statValue}>{authors.length}</div><div style={S.statLabel}>Authors</div></div>
        <div style={S.statCard}><div style={{ ...S.statValue, color: "#ef4444" }}>{totalRoyaltiesOwed.toLocaleString()}</div><div style={S.statLabel}>Royalties Owed (XAF)</div></div>
        <div style={S.statCard}><div style={{ ...S.statValue, color: "#f97316" }}>{unpaidRoyalties.length}</div><div style={S.statLabel}>Unpaid Items</div></div>
      </div>

      {/* ── Manuscripts ──────────────────────────────────────────────────────── */}
      <h2 style={S.sectionTitle}>Manuscripts ({manuscripts.length})</h2>
      {manuscripts.length === 0 ? <p style={S.mutedText}>No manuscripts recorded</p> : (
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead><tr>{["Title","Author","Status","Assigned Editor","Version","Date"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {manuscripts.map((m, i) => (
                <tr key={m.id} style={row(i)}>
                  <td style={{ ...S.td, fontWeight: 600 }}>{m.title}</td>
                  <td style={S.td}>{m.author || "—"}</td>
                  <td style={S.td}><span style={statusBadge(m.status)}>{m.status.replace(/_/g," ")}</span></td>
                  <td style={S.td}>{m.editor || <span style={S.mutedText}>unassigned</span>}</td>
                  <td style={S.td}>v{m.version}</td>
                  <td style={{ ...S.td, ...S.mutedText }}>{new Date(m.date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Authors ──────────────────────────────────────────────────────────── */}
      <h2 style={S.sectionTitle}>Authors ({authors.length})</h2>
      {authors.length === 0 ? <p style={S.mutedText}>No authors recorded</p> : (
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead><tr>{["Name","Email","Phone","Total Books","Royalties Owed (XAF)"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {authorStats.map((a, i) => (
                <tr key={a.id} style={row(i)}>
                  <td style={{ ...S.td, fontWeight: 600 }}>{a.name}</td>
                  <td style={S.td}>{a.email || "—"}</td>
                  <td style={S.td}>{a.phone || "—"}</td>
                  <td style={S.td}>{a.bookCount}</td>
                  <td style={{ ...S.td, color: a.totalOwed > 0 ? "#ef4444" : "#16a34a", fontWeight: 600 }}>
                    {a.totalOwed > 0 ? a.totalOwed.toLocaleString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Royalties Due ────────────────────────────────────────────────────── */}
      <h2 style={S.sectionTitle}>Royalties Due ({unpaidRoyalties.length})</h2>
      {unpaidRoyalties.length === 0 ? <p style={S.successText}>✓ All royalties settled</p> : (
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead><tr>{["Author","Book","Amount (XAF)","Due Date"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {unpaidRoyalties.map((r, i) => (
                <tr key={r.id} style={row(i)}>
                  <td style={{ ...S.td, fontWeight: 600 }}>{r.author}</td>
                  <td style={S.td}>{r.book || "—"}</td>
                  <td style={{ ...S.td, color: "#ef4444", fontWeight: 600 }}>{Number(r.amount).toLocaleString()}</td>
                  <td style={S.td}>{new Date(r.date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
