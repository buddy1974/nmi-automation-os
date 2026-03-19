import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

// PrintingJob model has no companyId — printing jobs are global

export default async function PrintingPage() {
  const jobs = await prisma.printingJob.findMany({
    orderBy: { date: "desc" },
  })

  const totalCost = jobs.reduce((sum, j) => sum + Number(j.cost), 0)

  return (
    <div>
      <h1>Printing</h1>
      <p>Total print cost: <strong>{totalCost.toLocaleString()} XAF</strong> ({jobs.length} jobs)</p>

      {jobs.length === 0 ? (
        <p>No printing jobs recorded</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Book</th>
              <th>Quantity</th>
              <th>Cost (XAF)</th>
              <th>Printer</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j.id}>
                <td>{j.book}</td>
                <td>{j.quantity.toLocaleString()}</td>
                <td>{Number(j.cost).toLocaleString()}</td>
                <td>{j.printer || "—"}</td>
                <td>{new Date(j.date).toLocaleDateString()}</td>
                <td>{j.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
