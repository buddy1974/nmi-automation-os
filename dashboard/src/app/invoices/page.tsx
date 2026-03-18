import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

export default async function InvoicesPage() {

  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
  })

  return (
    <div>

      <h1>Invoices</h1>

      {invoices.length === 0 ? (
        <p>No invoices yet. Create an order to generate one.</p>
      ) : (
        <table>

          <thead>
            <tr>
              <th>Number</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Due date</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>

          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id}>
                <td>{inv.number}</td>
                <td>{inv.customerName}</td>
                <td>{Number(inv.amount).toLocaleString()}</td>
                <td>{new Date(inv.dueDate).toLocaleDateString()}</td>
                <td>
                  <span style={{
                    color: inv.status === "issued" ? "green"
                         : inv.status === "unpaid" ? "orange"
                         : "#888"
                  }}>
                    {inv.status}
                  </span>
                </td>
                <td>{new Date(inv.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>

        </table>
      )}

    </div>
  )
}
