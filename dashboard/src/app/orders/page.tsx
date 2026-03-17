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

    const existing = orders.find(o => o.code === code)

    if (existing) {

      setOrders(
        orders.map(o =>
          o.code === code
            ? { ...o, qty: o.qty + 1 }
            : o
        )
      )

    } else {

      setOrders([
        ...orders,
        {
          code: product.code,
          title: product.title,
          price: product.price,
          qty: 1
        }
      ])

    }

  }


  function increase(code: string) {

    setOrders(
      orders.map(o =>
        o.code === code
          ? { ...o, qty: o.qty + 1 }
          : o
      )
    )

  }


  function decrease(code: string) {

    setOrders(
      orders.map(o =>
        o.code === code
          ? { ...o, qty: o.qty - 1 }
          : o
      ).filter(o => o.qty > 0)
    )

  }


  const total = orders.reduce(
    (sum, o) => sum + o.qty * o.price,
    0
  )


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


      <h2>Order</h2>

      <table>

        <thead>
          <tr>
            <th>Code</th>
            <th>Title</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Total</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>

          {orders.map(o => (

            <tr key={o.code}>

              <td>{o.code}</td>
              <td>{o.title}</td>
              <td>{o.qty}</td>
              <td>{o.price}</td>
              <td>{o.qty * o.price}</td>

              <td>

                <button onClick={() => increase(o.code)}>
                  +
                </button>

                <button onClick={() => decrease(o.code)}>
                  -
                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>


      <h2>Total: {total}</h2>

    </div>

  )

}
