import { cookies }    from "next/headers"
import { prisma }     from "@/lib/db"
import { getSession } from "@/lib/auth"

export const dynamic = "force-dynamic"

const ALLOWED_ROLES = ["owner", "admin"]

export default async function SystemPage() {
  const jar     = await cookies()
  const session = await getSession(jar.get("nmi_session")?.value)

  if (!session || !ALLOWED_ROLES.includes(session.role)) {
    return (
      <div>
        <h1>System</h1>
        <p>Access denied. Owner or admin role required.</p>
      </div>
    )
  }

  const [
    companies,
    users,
    orderCount,
    invoiceCount,
    productCount,
    workerCount,
    manuscriptCount,
    authorCount,
  ] = await Promise.all([
    prisma.company.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.order.count(),
    prisma.invoice.count(),
    prisma.product.count(),
    prisma.worker.count(),
    prisma.manuscript.count(),
    prisma.author.count(),
  ])

  return (
    <div>
      <h1>System Admin</h1>


      {/* ── System Stats ─────────────────────────────────────────────────────── */}

      <h2>System Stats</h2>

      <table>
        <tbody>
          <tr><td>Orders</td>      <td>{orderCount}</td></tr>
          <tr><td>Invoices</td>    <td>{invoiceCount}</td></tr>
          <tr><td>Products</td>    <td>{productCount}</td></tr>
          <tr><td>Workers</td>     <td>{workerCount}</td></tr>
          <tr><td>Manuscripts</td> <td>{manuscriptCount}</td></tr>
          <tr><td>Authors</td>     <td>{authorCount}</td></tr>
          <tr><td>Companies</td>   <td>{companies.length}</td></tr>
          <tr><td>Users</td>       <td>{users.length}</td></tr>
        </tbody>
      </table>


      {/* ── Companies ────────────────────────────────────────────────────────── */}

      <h2>Companies ({companies.length})</h2>

      {companies.length === 0 ? (
        <p>No companies created yet</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>City</th>
              <th>Active</th>
              <th>ID</th>
            </tr>
          </thead>
          <tbody>
            {companies.map(c => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.city || "—"}</td>
                <td>{c.active ? "Yes" : "No"}</td>
                <td style={{ fontSize: "11px", color: "#888" }}>{c.id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}


      {/* ── Users ────────────────────────────────────────────────────────────── */}

      <h2>Users ({users.length})</h2>

      {users.length === 0 ? (
        <p>No users created yet</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Company</th>
              <th>Active</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td style={{ fontSize: "11px", color: "#888" }}>{u.companyId ?? "—"}</td>
                <td>{u.active ? "Yes" : "No"}</td>
                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

    </div>
  )
}
