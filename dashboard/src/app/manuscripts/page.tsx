import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

// Manuscript model has no companyId — manuscripts are global (editorial pipeline)

const STATUS_ORDER = [
  "submitted",
  "reviewing",
  "editing",
  "approved",
  "rejected",
  "ready_for_print",
  "printing",
]

export default async function ManuscriptsPage() {
  const manuscripts = await prisma.manuscript.findMany({
    orderBy: { date: "desc" },
  })

  // ── Summary counts ──────────────────────────────────────────────────────────

  const countByStatus = STATUS_ORDER.map(status => ({
    status,
    count: manuscripts.filter(m => m.status === status).length,
  }))

  const printQueue = manuscripts.filter(m => m.readyForPrint)

  return (
    <div>
      <h1>Manuscripts</h1>


      {/* ── Summary ────────────────────────────────────────────────────────── */}

      <h2>Summary</h2>

      <table>
        <thead>
          <tr>
            <th>Status</th>
            <th>Count</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Total</strong></td>
            <td><strong>{manuscripts.length}</strong></td>
          </tr>
          {countByStatus.map(({ status, count }) => (
            <tr key={status}>
              <td>{status.replace(/_/g, " ")}</td>
              <td>{count}</td>
            </tr>
          ))}
        </tbody>
      </table>


      {/* ── Print Queue ────────────────────────────────────────────────────── */}

      <h2>Print Queue ({printQueue.length})</h2>

      {printQueue.length === 0 ? (
        <p>No manuscripts ready for print</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Title</th>
              <th>Author</th>
              <th>Subject</th>
              <th>Level / Class</th>
              <th>Suggested Code</th>
              <th>Version</th>
            </tr>
          </thead>
          <tbody>
            {printQueue.map((m, i) => (
              <tr key={m.id}>
                <td>{i + 1}</td>
                <td>{m.title}</td>
                <td>{m.author || "—"}</td>
                <td>{m.subject || "—"}</td>
                <td>{m.level} {m.class}</td>
                <td>{m.suggestedCode || "—"}</td>
                <td>v{m.version}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}


      {/* ── All Manuscripts ────────────────────────────────────────────────── */}

      <h2>All Manuscripts ({manuscripts.length})</h2>

      {manuscripts.length === 0 ? (
        <p>No manuscripts recorded</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>Subject</th>
              <th>Level / Class</th>
              <th>Status</th>
              <th>Version</th>
              <th>Editor</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {manuscripts.map(m => (
              <tr key={m.id}>
                <td>{m.title}</td>
                <td>{m.author || "—"}</td>
                <td>{m.subject || "—"}</td>
                <td>{m.level} {m.class}</td>
                <td>{m.status.replace(/_/g, " ")}</td>
                <td>v{m.version}</td>
                <td>{m.editor || "—"}</td>
                <td>{new Date(m.date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

    </div>
  )
}
