import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

// Authors and royalties have no companyId — they are global (editorial pipeline)
// Manuscripts are also global — no companyId on that model

export default async function EditorialPage() {
  const [manuscripts, authors, royalties] = await Promise.all([
    prisma.manuscript.findMany({
      orderBy: { date: "desc" },
    }),

    prisma.author.findMany({
      orderBy: { name: "asc" },
    }),

    prisma.royalty.findMany({
      orderBy: { date: "desc" },
    }),
  ])

  // ── Summary stats ───────────────────────────────────────────────────────────

  const totalRoyaltiesOwed = royalties
    .filter(r => r.status === "unpaid")
    .reduce((sum, r) => sum + Number(r.amount), 0)

  const unpaidRoyalties = royalties.filter(r => r.status === "unpaid")

  // ── Author enrichment — books + royalties per author ───────────────────────

  const authorStats = authors.map(a => {
    const authorRoyalties = royalties.filter(r => r.author === a.name)
    const totalOwed = authorRoyalties
      .filter(r => r.status === "unpaid")
      .reduce((sum, r) => sum + Number(r.amount), 0)
    const bookCount = new Set(authorRoyalties.map(r => r.book).filter(Boolean)).size

    return { ...a, bookCount, totalOwed }
  })

  return (
    <div>
      <h1>Editorial Hub</h1>


      {/* ── Summary ──────────────────────────────────────────────────────────── */}

      <h2>Summary</h2>

      <table>
        <tbody>
          <tr><td>Total manuscripts</td>   <td>{manuscripts.length}</td></tr>
          <tr><td>Total authors</td>       <td>{authors.length}</td></tr>
          <tr><td>Royalties owed (XAF)</td><td>{totalRoyaltiesOwed.toLocaleString()}</td></tr>
          <tr><td>Unpaid royalties</td>    <td>{unpaidRoyalties.length}</td></tr>
        </tbody>
      </table>


      {/* ── Manuscripts by status ─────────────────────────────────────────────── */}

      <h2>Manuscripts ({manuscripts.length})</h2>

      {manuscripts.length === 0 ? (
        <p>No manuscripts recorded</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>Status</th>
              <th>Assigned Editor</th>
              <th>Version</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {manuscripts.map(m => (
              <tr key={m.id}>
                <td>{m.title}</td>
                <td>{m.author || "—"}</td>
                <td>{m.status.replace(/_/g, " ")}</td>
                <td>{m.editor || "—"}</td>
                <td>v{m.version}</td>
                <td>{new Date(m.date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}


      {/* ── Authors ──────────────────────────────────────────────────────────── */}

      <h2>Authors ({authors.length})</h2>

      {authors.length === 0 ? (
        <p>No authors recorded</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Total Books</th>
              <th>Royalties Owed (XAF)</th>
            </tr>
          </thead>
          <tbody>
            {authorStats.map(a => (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td>{a.email || "—"}</td>
                <td>{a.phone || "—"}</td>
                <td>{a.bookCount}</td>
                <td>{a.totalOwed.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}


      {/* ── Royalties Due ────────────────────────────────────────────────────── */}

      <h2>Royalties Due ({unpaidRoyalties.length})</h2>

      {unpaidRoyalties.length === 0 ? (
        <p>All royalties settled</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Author</th>
              <th>Book</th>
              <th>Amount (XAF)</th>
              <th>Due Date</th>
            </tr>
          </thead>
          <tbody>
            {unpaidRoyalties.map(r => (
              <tr key={r.id}>
                <td>{r.author}</td>
                <td>{r.book || "—"}</td>
                <td>{Number(r.amount).toLocaleString()}</td>
                <td>{new Date(r.date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

    </div>
  )
}
