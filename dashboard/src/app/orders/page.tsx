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

type RoyaltyRecord = {
  id: number
  book: string
  author: string
  amount: number
  date: string
}

export default function OrdersPage() {

  const [products, setProducts] = useState<Product[]>(initialProducts)

  const [orders, setOrders] = useState<OrderItem[]>([])

  const [savedOrders, setSavedOrders] = useState<SavedOrder[]>([])

  const [royaltyRecords, setRoyaltyRecords] = useState<RoyaltyRecord[]>([])

  const [customers] = useState<Customer[]>([
    { id: 1, name: "School A" },
    { id: 2, name: "Bookshop B" }
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


    // ===== ROYALTY CALCULATION =====

    const newRoyalties: RoyaltyRecord[] = []

    orders.forEach(o => {

      const product = products.find(p => p.code === o.code)

      if (!product) return

      let royalty = 0

      if (product.royaltyType === "percent") {

        royalty =
          o.price *
          o.qty *
          product.royaltyValue /
          100

      }

      if (product.royaltyType === "fixed") {

        royalty =
          product.royaltyValue *
          o.qty

      }

      newRoyalties.push({

        id: Date.now() + Math.random(),

        book: product.title,

        author: product.author,

        amount: royalty,

        date: new Date().toLocaleDateString()

      })

    })

    setRoyaltyRecords([...royaltyRecords, ...newRoyalties])

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

      {orders.map(o => (

        <div key={o.code}>

          {o.title} — {o.qty}

          <button onClick={() => increase(o.code)}>+</button>

          <button onClick={() => decrease(o.code)}>-</button>

        </div>

      ))}


      <h2>Total: {total}</h2>

      <button onClick={saveOrder}>
        Save Order
      </button>



      <h2>Royalty Records</h2>

      {royaltyRecords.map(r => (

        <div key={r.id}>

          {r.book} — {r.author} — {r.amount}

        </div>

      ))}


    </div>

  )

}
