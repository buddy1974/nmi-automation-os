import { cookies }    from "next/headers"
import { prisma }     from "@/lib/db"
import { getSession } from "@/lib/auth"
import { resolveCompany, directFilter } from "@/lib/companyFilter"
import OrderForm from "./OrderForm"

export const dynamic = "force-dynamic"

export default async function OrdersPage() {
  const jar     = await cookies()
  const session = await getSession(jar.get("nmi_session")?.value)
  const cid     = session ? resolveCompany(session, jar.get("nmi_company")?.value) : undefined

  const [dbProducts, dbCustomers, savedOrders] = await Promise.all([
    prisma.product.findMany({ orderBy: { code: "asc" } }),
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.order.findMany({
      where:   directFilter(cid),
      include: { items: true },
      orderBy: { id: "desc" },
    }),
  ])

  // Serialize Decimal fields before passing to client component
  const products = dbProducts.map(p => ({
    id: p.id,
    code: p.code,
    title: p.title,
    price: Number(p.price),
    stock: p.stock,
  }))

  const customers = dbCustomers.map(c => ({
    id: c.id,
    name: c.name,
  }))

  return (
    <div>
      <h1>Orders</h1>

      <OrderForm products={products} customers={customers} />

      <h2>Saved Orders</h2>
      {savedOrders.length === 0 ? (
        <p>No orders yet</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Number</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {savedOrders.map(o => (
              <tr key={o.id}>
                <td>{o.number}</td>
                <td>{o.customerName}</td>
                <td>{new Date(o.date).toLocaleDateString()}</td>
                <td>{Number(o.total).toLocaleString()}</td>
                <td>{o.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
