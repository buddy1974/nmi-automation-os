import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

export default async function StockPage() {

  const products = await prisma.product.findMany({
    orderBy: { code: "asc" },
    include: {
      stockHistory: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  })

  return (
    <div>

      <h1>Stock</h1>

      <table>

        <thead>
          <tr>
            <th>Code</th>
            <th>Product</th>
            <th>Stock</th>
            <th>Last movements</th>
          </tr>
        </thead>

        <tbody>

          {products.map((p) => (

            <tr key={p.id}>

              <td>{p.code}</td>
              <td>{p.title}</td>
              <td>{p.stock}</td>

              <td>
                {p.stockHistory.length === 0 ? (
                  <span style={{ color: "#888" }}>—</span>
                ) : (
                  <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                    {p.stockHistory.map((h) => (
                      <li key={h.id} style={{ fontSize: "0.85rem", marginBottom: 2 }}>
                        <span style={{ color: h.change > 0 ? "green" : "red", fontWeight: "bold" }}>
                          {h.change > 0 ? "+" : ""}{h.change}
                        </span>
                        {" "}
                        <span style={{ color: "#555" }}>{h.reason}</span>
                        {h.note ? (
                          <span style={{ color: "#999" }}> — {h.note}</span>
                        ) : null}
                        <span style={{ color: "#aaa", marginLeft: 6 }}>
                          {new Date(h.createdAt).toLocaleDateString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  )
}
