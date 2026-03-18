import { prisma } from "@/lib/db"

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany()

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Customers</h1>
        <button>Add Customer</button>
      </div>

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
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.phone}</td>
                <td>{c.address}</td>
                <td>{c.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
