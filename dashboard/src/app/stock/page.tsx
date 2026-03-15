"use client"

import { useState } from "react"
import { products as initialProducts } from "@/lib/products"

export default function StockPage() {

  const [items, setItems] = useState(initialProducts)

  function addStock(id: string) {
    setItems((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, stock: p.stock + 10 } : p
      )
    )
  }

  function removeStock(id: string) {
    setItems((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, stock: p.stock - 10 } : p
      )
    )
  }

  return (
    <div>

      <h1>Stock</h1>

      <table>

        <thead>
          <tr>
            <th>Code</th>
            <th>Title</th>
            <th>Stock</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>

          {items.map((p) => (

            <tr key={p.id}>

              <td>{p.code}</td>
              <td>{p.title}</td>
              <td>{p.stock}</td>

              <td>

                <button onClick={() => addStock(p.id)}>
                  +10
                </button>

                <button onClick={() => removeStock(p.id)}>
                  -10
                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  )
}
