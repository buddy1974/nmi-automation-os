"use client"

import { useState } from "react"
import { saveOrder } from "./actions"

type ProductRow = {
  id: number
  code: string
  title: string
  price: number
  stock: number
}

type CustomerRow = {
  id: number
  name: string
}

type CartItem = {
  code: string
  title: string
  qty: number
  price: number
}

export default function OrderForm({
  products: initialProducts,
  customers,
}: {
  products: ProductRow[]
  customers: CustomerRow[]
}) {
  const [products, setProducts] = useState(initialProducts)
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerId, setCustomerId] = useState<number>(customers[0]?.id ?? 0)
  const [saving, setSaving] = useState(false)

  function addToCart(code: string) {
    const product = products.find(p => p.code === code)
    if (!product || product.stock <= 0) return

    setProducts(products.map(p =>
      p.code === code ? { ...p, stock: p.stock - 1 } : p
    ))

    const existing = cart.find(i => i.code === code)
    if (existing) {
      setCart(cart.map(i =>
        i.code === code ? { ...i, qty: i.qty + 1 } : i
      ))
    } else {
      setCart([...cart, {
        code: product.code,
        title: product.title,
        price: product.price,
        qty: 1,
      }])
    }
  }

  function increase(code: string) {
    const product = products.find(p => p.code === code)
    if (!product || product.stock <= 0) return

    setProducts(products.map(p =>
      p.code === code ? { ...p, stock: p.stock - 1 } : p
    ))
    setCart(cart.map(i =>
      i.code === code ? { ...i, qty: i.qty + 1 } : i
    ))
  }

  function decrease(code: string) {
    setCart(
      cart
        .map(i => i.code === code ? { ...i, qty: i.qty - 1 } : i)
        .filter(i => i.qty > 0)
    )
    setProducts(products.map(p =>
      p.code === code ? { ...p, stock: p.stock + 1 } : p
    ))
  }

  async function handleSave() {
    if (cart.length === 0) return
    setSaving(true)
    const customer = customers.find(c => c.id === customerId)
    await saveOrder({
      customerId: customerId || null,
      customerName: customer?.name ?? "",
      items: cart.map(i => ({
        productCode: i.code,
        title: i.title,
        qty: i.qty,
        price: i.price,
      })),
    })
    setCart([])
    setSaving(false)
  }

  const total = cart.reduce((sum, i) => sum + i.qty * i.price, 0)

  return (
    <div>
      <h2>Customer</h2>
      {customers.length === 0 ? (
        <p>No customers in database</p>
      ) : (
        <select
          value={customerId}
          onChange={e => setCustomerId(Number(e.target.value))}
        >
          {customers.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      )}

      <h2>Add item</h2>
      {products.map(p => (
        <div key={p.id}>
          {p.code} — {p.title} — stock: {p.stock}
          <button onClick={() => addToCart(p.code)}>Add</button>
        </div>
      ))}

      <h2>Order</h2>
      {cart.map(i => (
        <div key={i.code}>
          {i.title} — {i.qty}
          <button onClick={() => increase(i.code)}>+</button>
          <button onClick={() => decrease(i.code)}>-</button>
        </div>
      ))}

      <h2>Total: {total}</h2>
      <button onClick={handleSave} disabled={saving || cart.length === 0}>
        {saving ? "Saving..." : "Save Order"}
      </button>
    </div>
  )
}
