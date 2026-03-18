import { prisma } from "@/lib/db"

export default async function CataloguePage() {
  const products = await prisma.product.findMany()

  return (
    <div>
      <h1>Catalogue</h1>
      {products.length === 0 ? (
        <p>No products found</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Title</th>
              <th>Level</th>
              <th>Class</th>
              <th>Subject</th>
              <th>Price</th>
              <th>Stock</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.code}</td>
                <td>{p.title}</td>
                <td>{p.level}</td>
                <td>{p.class}</td>
                <td>{p.subject}</td>
                <td>{p.price.toString()}</td>
                <td>{p.stock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
