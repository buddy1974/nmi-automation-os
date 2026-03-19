import { cookies }    from "next/headers"
import { prisma }     from "@/lib/db"
import { getSession } from "@/lib/auth"
import { resolveCompany } from "@/lib/companyFilter"

export const dynamic = "force-dynamic"

// Customer model has no companyId — we scope by customers who have orders
// for the active company. If no company filter, all customers are shown.

export default async function CustomersPage() {
  const jar     = await cookies()
  const session = await getSession(jar.get("nmi_session")?.value)
  const cid     = session ? resolveCompany(session, jar.get("nmi_company")?.value) : undefined

  const customers = await prisma.customer.findMany({
    where: cid
      ? { orders: { some: { companyId: cid } } }
      : undefined,
    orderBy: { name: "asc" },
  })

  return (
    <div>
      <h1>Customers</h1>
      <p>{customers.length} customer{customers.length !== 1 ? "s" : ""}</p>

      {customers.length === 0 ? (
        <p>No customers found</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Type</th>
              <th>Region</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.phone || "—"}</td>
                <td>{c.address || "—"}</td>
                <td>{c.type}</td>
                <td>{c.region || "—"}</td>
                <td>{c.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
