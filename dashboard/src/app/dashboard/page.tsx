import { cookies }    from "next/headers"
import Link           from "next/link"
import { prisma }     from "@/lib/db"
import { getSession } from "@/lib/auth"
import { resolveCompany, directFilter } from "@/lib/companyFilter"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const jar     = await cookies()
  const session = await getSession(jar.get("nmi_session")?.value)
  const cid     = session ? resolveCompany(session, jar.get("nmi_company")?.value) : undefined

  const companyWhere = directFilter(cid)

  const [
    orderCount,
    revenueAgg,
    activeWorkerCount,
    pendingInvoiceCount,
    lowStockBooks,
    printReadyManuscripts,
    unpaidRoyalties,
    workersWithoutCnps,
  ] = await Promise.all([
    prisma.order.count({ where: companyWhere }),

    prisma.order.aggregate({
      _sum: { total: true },
      where: companyWhere,
    }),

    prisma.worker.count({
      where: { ...companyWhere, status: "active" },
    }),

    prisma.invoice.count({
      where: { ...companyWhere, status: { not: "paid" } },
    }),

    prisma.product.findMany({
      where:   { stock: { lt: 10 } },
      orderBy: { stock: "asc" },
      select:  { code: true, title: true, stock: true },
    }),

    prisma.manuscript.findMany({
      where:  { readyForPrint: true },
      select: { id: true, title: true, author: true },
    }),

    prisma.royalty.findMany({
      where:  { status: "unpaid" },
      select: { id: true, author: true, book: true, amount: true },
    }),

    prisma.worker.findMany({
      where: {
        ...companyWhere,
        cnpsNumber:   "",
        contractType: { in: ["CDI", "CDD"] },
      },
      select: { id: true, name: true, contractType: true },
    }),
  ])

  const totalRevenue = Number(revenueAgg._sum.total ?? 0)

  return (
    <div>
      <h1>Dashboard</h1>


      {/* ── KPI summary ───────────────────────────────────────────────────── */}

      <h2>Summary</h2>

      <table>
        <tbody>
          <tr><td>Total orders</td>           <td>{orderCount}</td></tr>
          <tr><td>Total revenue (XAF)</td>    <td>{totalRevenue.toLocaleString()}</td></tr>
          <tr><td>Active workers</td>         <td>{activeWorkerCount}</td></tr>
          <tr><td>Pending invoices</td>       <td>{pendingInvoiceCount}</td></tr>
          <tr><td>Low stock titles</td>       <td>{lowStockBooks.length}</td></tr>
          <tr><td>Print-ready manuscripts</td><td>{printReadyManuscripts.length}</td></tr>
          <tr><td>Unpaid royalties</td>       <td>{unpaidRoyalties.length}</td></tr>
        </tbody>
      </table>


      {/* ── Quick links ───────────────────────────────────────────────────── */}

      <h2>Quick Links</h2>

      <div>
        <Link href="/orders">      <button>Orders</button>      </Link>
        <Link href="/stock">       <button>Stock</button>       </Link>
        <Link href="/manuscripts"> <button>Manuscripts</button> </Link>
        <Link href="/printing">    <button>Printing</button>    </Link>
        <Link href="/accounting">  <button>Accounting</button>  </Link>
        <Link href="/hr">          <button>HR</button>          </Link>
        <Link href="/customers">   <button>Customers</button>   </Link>
        <Link href="/royalties">   <button>Royalties</button>   </Link>
        <Link href="/authors">     <button>Authors</button>     </Link>
      </div>


      {/* ── Low stock alert ───────────────────────────────────────────────── */}

      <h2>Low Stock</h2>

      {lowStockBooks.length === 0 ? (
        <div>All stock levels OK</div>
      ) : (
        lowStockBooks.map(b => (
          <div key={b.code}>
            {b.code} — {b.title} — stock: {b.stock}
          </div>
        ))
      )}


      {/* ── Print-ready manuscripts ───────────────────────────────────────── */}

      <h2>Ready for Print</h2>

      {printReadyManuscripts.length === 0 ? (
        <div>No manuscripts pending</div>
      ) : (
        printReadyManuscripts.map(m => (
          <div key={m.id}>{m.title} — {m.author}</div>
        ))
      )}


      {/* ── Unpaid royalties ─────────────────────────────────────────────── */}

      <h2>Unpaid Royalties</h2>

      {unpaidRoyalties.length === 0 ? (
        <div>All royalties settled</div>
      ) : (
        unpaidRoyalties.map(r => (
          <div key={r.id}>
            {r.author} — {r.book} — {Number(r.amount).toLocaleString()} XAF
          </div>
        ))
      )}


      {/* ── HR alerts ────────────────────────────────────────────────────── */}

      <h2>HR Alerts</h2>

      {workersWithoutCnps.length === 0 ? (
        <div>HR compliance OK</div>
      ) : (
        workersWithoutCnps.map(w => (
          <div key={w.id}>{w.name} ({w.contractType}) — CNPS number missing</div>
        ))
      )}


      {/* ── Reports ──────────────────────────────────────────────────────── */}

      <h2>Reports</h2>

      <div>
        <Link href="/accounting"><button>Sales Report</button></Link>
        <Link href="/royalties"> <button>Royalty Report</button></Link>
        <Link href="/printing">  <button>Print Report</button></Link>
        <Link href="/hr">        <button>HR Report</button></Link>
        <Link href="/finance">   <button>Finance Report</button></Link>
      </div>

    </div>
  )
}
