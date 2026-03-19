import { cookies }    from "next/headers"
import { prisma }     from "@/lib/db"
import { getSession } from "@/lib/auth"
import { resolveCompany, directFilter } from "@/lib/companyFilter"

export const dynamic = "force-dynamic"

export default async function AccountingPage() {
  const jar     = await cookies()
  const session = await getSession(jar.get("nmi_session")?.value)
  const cid     = session ? resolveCompany(session, jar.get("nmi_company")?.value) : undefined

  const companyWhere = directFilter(cid)

  const [costs, royalties, revenueAgg] = await Promise.all([
    prisma.costRecord.findMany({ orderBy: { date: "desc" } }),
    prisma.royalty.findMany({ orderBy: { date: "desc" } }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: companyWhere,
    }),
  ])

  const totalRevenue   = Number(revenueAgg._sum.total ?? 0)
  const totalCosts     = costs.reduce((sum, c) => sum + Number(c.amount), 0)
  const totalRoyalties = royalties.reduce((sum, r) => sum + Number(r.amount), 0)
  const totalProfit    = totalRevenue - totalCosts - totalRoyalties

  return (
    <div>
      <h1>Accounting</h1>


      {/* ── Global report ──────────────────────────────────────────────────── */}

      <h2>Global Report</h2>

      <table>
        <tbody>
          <tr><td>Total Revenue</td>   <td>{totalRevenue.toLocaleString()} XAF</td></tr>
          <tr><td>Total Costs</td>     <td>{totalCosts.toLocaleString()} XAF</td></tr>
          <tr><td>Total Royalties</td> <td>{totalRoyalties.toLocaleString()} XAF</td></tr>
          <tr><td><strong>Profit</strong></td>
              <td><strong>{totalProfit.toLocaleString()} XAF</strong></td></tr>
        </tbody>
      </table>


      {/* ── Costs ─────────────────────────────────────────────────────────── */}

      <h2>Costs ({costs.length})</h2>

      {costs.length === 0 ? (
        <p>No costs recorded</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Book</th>
              <th>Type</th>
              <th>Amount (XAF)</th>
              <th>Date</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {costs.map((c) => (
              <tr key={c.id}>
                <td>{c.book || "—"}</td>
                <td>{c.type}</td>
                <td>{Number(c.amount).toLocaleString()}</td>
                <td>{new Date(c.date).toLocaleDateString()}</td>
                <td>{c.notes || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}


      {/* ── Royalties ─────────────────────────────────────────────────────── */}

      <h2>Royalties ({royalties.length})</h2>

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
