import { products } from "@/lib/products"

export default function StockPage() {
  return (
    <div>

      <h1>Stock</h1>

      <table>

        <thead>
          <tr>
            <th>Code</th>
            <th>Title</th>
            <th>Class</th>
            <th>Subject</th>
            <th>Stock</th>
          </tr>
        </thead>

        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>{p.code}</td>
              <td>{p.title}</td>
              <td>{p.class}</td>
              <td>{p.subject}</td>
              <td>{p.stock}</td>
            </tr>
          ))}
        </tbody>

      </table>

    </div>
  )
}
