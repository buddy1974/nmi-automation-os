"use client"

import { useState } from "react"
import { products as initialProducts } from "@/lib/products"

type LogEntry = {
  id: string
  action: string
  qty: number
  time: string
}

export default function StockPage() {

  const [items, setItems] = useState(initialProducts)
  const [log, setLog] = useState<LogEntry[]>([])

  function addStock(id: string) {
    setItems((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, stock: p.stock + 10 } : p
      )
    )
    setLog((prev) => [
      { id, action: "add", qty: 10, time: new Date().toISOString() },
      ...prev,
    ])
  }

  function removeStock(id: string) {
    setItems((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, stock: p.stock - 10 } : p
      )
    )
    setLog((prev) => [
      { id, action: "remove", qty: 10, time: new Date().toISOString() },
      ...prev,
    ])
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

      <h2>Stock Log</h2>

      <ul>

        {log.map((l, i) => (

          <li key={i}>

            {l.time} — {l.id} — {l.action} — {l.qty}

          </li>

        ))}

      </ul>

    </div>
  )
}
