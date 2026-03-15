"use client"

import { useState } from "react"
import { products } from "@/lib/products"

type OrderItem = {
  code: string
  title: string
  qty: number
  price: number
}

export default function OrdersPage() {

  const [orders, setOrders] = useState<OrderItem[]>([])

  function addOrder(code: string) {

    const product = products.find(p => p.code === code)

    if (!product) return

    setOrders([
      ...orders,
      {
        code: product.code,
        title: product.title,
        qty: 1,
        price: product.price
      }
    ])

  }

  return (

    <div>

      <h1>Orders</h1>


      <h2>Add item</h2>

      {products.map(p => (

        <div key={p.id}>

          {p.code} — {p.title}

          <button onClick={() => addOrder(p.code)}>
            Add
          </button>

        </div>

      ))}


      <h2>Order list</h2>

      <ul>

        {orders.map((o, i) => (

          <li key={i}>

            {o.code} — {o.title} — {o.qty} — {o.price}

          </li>

        ))}

      </ul>

    </div>

  )

}
