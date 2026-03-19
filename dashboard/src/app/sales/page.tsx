import styles      from "./page.module.css"
import { cookies }    from "next/headers"
import { prisma }     from "@/lib/db"
import { getSession } from "@/lib/auth"
import { resolveCompany, directFilter } from "@/lib/companyFilter"

export const dynamic = "force-dynamic"

export default async function SalesPage() {
  const jar     = await cookies()
  const session = await getSession(jar.get("nmi_session")?.value)
  const cid     = session ? resolveCompany(session, jar.get("nmi_company")?.value) : undefined

  const orders = await prisma.order.findMany({
    where:   directFilter(cid),
    include: { branch: true },
    orderBy: { id: "desc" },
  })

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0)

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Sales</h1>

      <p>Total revenue: <strong>{totalRevenue.toLocaleString()} XAF</strong> ({orders.length} orders)</p>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Branch</th>
              <th>Date</th>
              <th>Status</th>
              <th>Total (XAF)</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan={6}>No orders found</td></tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id}>
                  <td>{o.number}</td>
                  <td>{o.customerName}</td>
                  <td>{o.branch?.name ?? "—"}</td>
                  <td>{new Date(o.date).toLocaleDateString()}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[o.status] ?? ""}`}>
                      {o.status}
                    </span>
                  </td>
                  <td>{Number(o.total).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
