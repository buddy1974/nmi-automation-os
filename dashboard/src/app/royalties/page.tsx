import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

// Royalty model has no companyId — royalties are global (per author/book)

export default async function RoyaltiesPage() {
  const royalties = await prisma.royalty.findMany({
    orderBy: { date: "desc" },
  })

  const unpaidTotal = royalties
    .filter(r => r.status === "unpaid")
    .reduce((sum, r) => sum + Number(r.amount), 0)

  const paidTotal = royalties
    .filter(r => r.status === "paid")
    .reduce((sum, r) => sum + Number(r.amount), 0)

  return (
    <div>
      <h1>Royalties</h1>

      <table>
        <tbody>
          <tr><td>Unpaid</td><td>{unpaidTotal.toLocaleString()} XAF</td></tr>
          <tr><td>Paid</td>  <td>{paidTotal.toLocaleString()} XAF</td></tr>
        </tbody>
      </table>

      <h2>All Royalties</h2>

      {royalties.length === 0 ? (
        <p>No royalties recorded</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Author</th>
              <th>Book</th>
              <th>Amount (XAF)</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {royalties.map((r) => (
              <tr key={r.id}>
                <td>{r.author}</td>
                <td>{r.book || "—"}</td>
                <td>{Number(r.amount).toLocaleString()}</td>
                <td>{new Date(r.date).toLocaleDateString()}</td>
                <td>{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
