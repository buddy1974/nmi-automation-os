"use client"

import { useState }           from "react"
import { saveOrder }          from "./actions"
import CameroonAddressInput   from "@/app/components/CameroonAddressInput"

type ProductRow = { id: number; code: string; title: string; price: number; stock: number }
type CustomerRow = { id: number; name: string }
type CartItem    = { code: string; title: string; qty: number; price: number }

const F = {
  label: {
    display:      "block",
    fontSize:     "12px",
    fontWeight:   700,
    color:        "#374151",
    marginBottom: "6px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
  select: {
    width:        "100%",
    padding:      "10px 14px",
    border:       "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize:     "14px",
    color:        "#1e293b",
    background:   "#fff",
    outline:      "none",
    cursor:       "pointer",
  },
}

export default function OrderForm({
  products: initialProducts,
  customers,
}: {
  products:  ProductRow[]
  customers: CustomerRow[]
}) {
  const [products,      setProducts]      = useState(initialProducts)
  const [cart,          setCart]          = useState<CartItem[]>([])
  const [customerId,    setCustomerId]    = useState<number>(customers[0]?.id ?? 0)
  const [saving,        setSaving]        = useState(false)
  const [search,        setSearch]        = useState("")
  const [saved,         setSaved]         = useState(false)
  const [deliveryCity,  setDeliveryCity]  = useState("")

  const filtered = products.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.code.toLowerCase().includes(search.toLowerCase())
  )

  function addToCart(code: string) {
    const product = products.find(p => p.code === code)
    if (!product || product.stock <= 0) return
    setProducts(products.map(p => p.code === code ? { ...p, stock: p.stock - 1 } : p))
    const existing = cart.find(i => i.code === code)
    if (existing) {
      setCart(cart.map(i => i.code === code ? { ...i, qty: i.qty + 1 } : i))
    } else {
      setCart([...cart, { code: product.code, title: product.title, price: product.price, qty: 1 }])
    }
  }

  function increase(code: string) {
    const product = products.find(p => p.code === code)
    if (!product || product.stock <= 0) return
    setProducts(products.map(p => p.code === code ? { ...p, stock: p.stock - 1 } : p))
    setCart(cart.map(i => i.code === code ? { ...i, qty: i.qty + 1 } : i))
  }

  function decrease(code: string) {
    setCart(cart.map(i => i.code === code ? { ...i, qty: i.qty - 1 } : i).filter(i => i.qty > 0))
    setProducts(products.map(p => p.code === code ? { ...p, stock: p.stock + 1 } : p))
  }

  function remove(code: string) {
    const item = cart.find(i => i.code === code)
    if (!item) return
    setProducts(products.map(p => p.code === code ? { ...p, stock: p.stock + item.qty } : p))
    setCart(cart.filter(i => i.code !== code))
  }

  async function handleSave() {
    if (cart.length === 0) return
    setSaving(true)
    const customer = customers.find(c => c.id === customerId)
    await saveOrder({
      customerId:   customerId || null,
      customerName: customer?.name ?? "",
      items: cart.map(i => ({ productCode: i.code, title: i.title, qty: i.qty, price: i.price })),
    })
    setCart([])
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const total = cart.reduce((sum, i) => sum + i.qty * i.price, 0)

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24, alignItems: "start" }}>

      {/* ── Left: Customer + Product picker ───────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Customer */}
        <div>
          <label style={F.label}>Customer</label>
          {customers.length === 0 ? (
            <p style={{ fontSize: 13, color: "#9ca3af" }}>No customers in database. Add one first.</p>
          ) : (
            <select value={customerId} onChange={e => setCustomerId(Number(e.target.value))} style={F.select}>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
        </div>

        {/* Delivery city */}
        <div>
          <label style={F.label}>Delivery City</label>
          <CameroonAddressInput
            value={deliveryCity}
            onChange={setDeliveryCity}
            onSelect={s => setDeliveryCity(s.city || s.display)}
            placeholder="Search delivery city in Cameroon..."
          />
        </div>

        {/* Product search */}
        <div>
          <label style={F.label}>Add Products</label>
          <input
            type="text"
            placeholder="Search by name or code…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width:        "100%",
              padding:      "9px 14px",
              border:       "1px solid #e2e8f0",
              borderRadius: "8px",
              fontSize:     "13px",
              marginBottom: "8px",
              outline:      "none",
              boxSizing:    "border-box",
            }}
          />

          <div style={{
            background:   "#fff",
            border:       "1px solid #e2e8f0",
            borderRadius: "8px",
            overflow:     "hidden",
            maxHeight:    340,
            overflowY:    "auto",
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Code","Product","Price (XAF)","Stock",""].map(h => (
                    <th key={h} style={{
                      padding:       "10px 14px",
                      textAlign:     "left",
                      fontSize:      "11px",
                      fontWeight:    700,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      color:         "#64748b",
                      borderBottom:  "2px solid #e2e8f0",
                      whiteSpace:    "nowrap",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "20px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                      No products found
                    </td>
                  </tr>
                ) : filtered.map((p, i) => (
                  <tr key={p.id} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                    <td style={{ padding: "10px 14px", fontSize: 13, color: "#1a73e8", fontWeight: 600, borderBottom: "1px solid #f1f5f9" }}>
                      {p.code}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 13, color: "#1e293b", borderBottom: "1px solid #f1f5f9" }}>
                      {p.title}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 13, color: "#1e293b", borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap" }}>
                      {p.price.toLocaleString()}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 13, borderBottom: "1px solid #f1f5f9" }}>
                      <span style={{
                        color:      p.stock === 0 ? "#ef4444" : p.stock < 5 ? "#f97316" : "#16a34a",
                        fontWeight: 600,
                      }}>
                        {p.stock}
                      </span>
                    </td>
                    <td style={{ padding: "8px 14px", borderBottom: "1px solid #f1f5f9" }}>
                      <button
                        onClick={() => addToCart(p.code)}
                        disabled={p.stock === 0}
                        style={{
                          background:   p.stock === 0 ? "#f1f5f9" : "#1a73e8",
                          color:        p.stock === 0 ? "#9ca3af"  : "#fff",
                          border:       "none",
                          borderRadius: "6px",
                          padding:      "5px 14px",
                          fontSize:     "12px",
                          fontWeight:   700,
                          cursor:       p.stock === 0 ? "not-allowed" : "pointer",
                          whiteSpace:   "nowrap",
                        }}
                      >
                        {p.stock === 0 ? "Out of stock" : "+ Add"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Right: Order summary + submit ─────────────────────────────────── */}
      <div style={{
        background:   "#fff",
        border:       "1px solid #e2e8f0",
        borderRadius: 10,
        overflow:     "hidden",
        position:     "sticky",
        top:          20,
      }}>

        {/* Summary header */}
        <div style={{
          padding:      "14px 20px",
          borderBottom: "1px solid #f1f5f9",
          fontWeight:   700,
          fontSize:     15,
          color:        "#1a1a2e",
          background:   "#f8fafc",
        }}>
          Order Summary
          {cart.length > 0 && (
            <span style={{
              marginLeft:   8,
              background:   "#1a73e8",
              color:        "#fff",
              borderRadius: "999px",
              padding:      "1px 8px",
              fontSize:     11,
              fontWeight:   700,
            }}>
              {cart.reduce((s, i) => s + i.qty, 0)} items
            </span>
          )}
        </div>

        {/* Cart items */}
        <div style={{ padding: "8px 0", minHeight: 80 }}>
          {cart.length === 0 ? (
            <div style={{ padding: "28px 20px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
              No items added yet
            </div>
          ) : cart.map(item => (
            <div key={item.code} style={{
              display:       "flex",
              alignItems:    "center",
              padding:       "8px 16px",
              gap:           10,
              borderBottom:  "1px solid #f8fafc",
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.title}
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>
                  {item.price.toLocaleString()} XAF × {item.qty} = {(item.price * item.qty).toLocaleString()}
                </div>
              </div>

              {/* Qty controls */}
              <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                <button
                  onClick={() => decrease(item.code)}
                  style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", fontSize: 16, fontWeight: 700, color: "#374151", lineHeight: 1 }}
                >
                  −
                </button>
                <span style={{ fontSize: 13, fontWeight: 700, width: 24, textAlign: "center" }}>{item.qty}</span>
                <button
                  onClick={() => increase(item.code)}
                  style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", fontSize: 16, fontWeight: 700, color: "#374151", lineHeight: 1 }}
                >
                  +
                </button>
              </div>

              {/* Remove */}
              <button
                onClick={() => remove(item.code)}
                style={{ width: 24, height: 24, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", fontSize: 14, color: "#9ca3af", flexShrink: 0 }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Total + submit */}
        <div style={{ padding: "16px 20px", borderTop: "2px solid #e2e8f0", background: "#f8fafc" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>Order Total</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: "#1a1a2e" }}>
              {total.toLocaleString()} <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>XAF</span>
            </span>
          </div>

          {saved && (
            <div style={{ background: "#dcfce7", color: "#166534", borderRadius: 8, padding: "8px 12px", fontSize: 13, fontWeight: 600, marginBottom: 10, textAlign: "center" }}>
              ✓ Order saved successfully
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving || cart.length === 0}
            style={{
              width:        "100%",
              padding:      "12px",
              background:   saving || cart.length === 0 ? "#e5e7eb" : "#1a1a2e",
              color:        saving || cart.length === 0 ? "#9ca3af"  : "#fff",
              border:       "none",
              borderRadius: "8px",
              fontSize:     "14px",
              fontWeight:   700,
              cursor:       saving || cart.length === 0 ? "not-allowed" : "pointer",
              transition:   "background 0.15s",
            }}
          >
            {saving ? "Saving…" : "Place Order"}
          </button>
        </div>
      </div>

    </div>
  )
}
