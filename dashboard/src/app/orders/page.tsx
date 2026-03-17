"use client"

import { useState } from "react"
import { products as initialProducts, type Product } from "@/lib/products"

type OrderItem = {
  code: string
  title: string
  qty: number
  price: number
}

type Customer = {
  id: number
  name: string
}

type SavedOrder = {
  id: number
  number: string
  customer: string | undefined
  date: string
  items: OrderItem[]
  total: number
}

export default function OrdersPage() {

  const [products, setProducts] = useState<Product[]>(initialProducts)

  const [orders, setOrders] = useState<OrderItem[]>([])

  const [savedOrders, setSavedOrders] = useState<SavedOrder[]>([])

  const [customers] = useState<Customer[]>([
    { id: 1, name: "School A" },
    { id: 2, name: "Bookshop B" },
    { id: 3, name: "Parent C" }
  ])

  const [customerId, setCustomerId] = useState<number>(1)



  function addOrder(code: string) {

    const product = products.find(p => p.code === code)

    if (!product) return
    if (product.stock <= 0) return

    const existing = orders.find(o => o.code === code)

    setProducts(
      products.map(p =>
        p.code === code
          ? { ...p, stock: p.stock - 1 }
          : p
      )
    )

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

    const product = products.find(p => p.code === code)

    if (!product) return
    if (product.stock <= 0) return

    setProducts(
      products.map(p =>
        p.code === code
          ? { ...p, stock: p.stock - 1 }
          : p
      )
    )

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
      orders
        .map(o =>
          o.code === code
            ? { ...o, qty: o.qty - 1 }
            : o
        )
        .filter(o => o.qty > 0)
    )

    setProducts(
      products.map(p =>
        p.code === code
          ? { ...p, stock: p.stock + 1 }
          : p
      )
    )

  }



  function saveOrder() {

    if (orders.length === 0) return

    const customer = customers.find(c => c.id === customerId)

    const newOrder: SavedOrder = {

      id: Date.now(),

      number: "ORD-" + Date.now(),

      customer: customer?.name,

      date: new Date().toLocaleDateString(),

      items: orders,

      total: orders.reduce(
        (sum, o) => sum + o.qty * o.price,
        0
      )

    }

    setSavedOrders([...savedOrders, newOrder])

    setOrders([])

  }



  const total = orders.reduce(
    (sum, o) => sum + o.qty * o.price,
    0
  )


  return (

    <div>

      <h1>Orders</h1>


      <h2>Customer</h2>

      <select
        value={customerId}
        onChange={(e) => setCustomerId(Number(e.target.value))}
      >

        {customers.map(c => (

          <option key={c.id} value={c.id}>
            {c.name}
          </option>

        ))}

      </select>



      <h2>Add item</h2>

      {products.map(p => (

        <div key={p.id}>

          {p.code} — {p.title} — stock: {p.stock}

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

                <button onClick={() => increase(o.code)}>+</button>

                <button onClick={() => decrease(o.code)}>-</button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>


      <h2>Total: {total}</h2>


      <button onClick={saveOrder}>
        Save Order
      </button>



      <h2>Saved Orders</h2>

      {savedOrders.map(o => (

        <div key={o.id}>

          {o.number} — {o.customer} — {o.date} — Total: {o.total}

        </div>

      ))}


    </div>

  )

}
