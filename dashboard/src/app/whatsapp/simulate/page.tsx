"use client"

import { useState }  from "react"
import Link          from "next/link"
import AIWriteButton from "@/app/components/AIWriteButton"

const QUICK_MESSAGES = [
  { label: "FR — Prix livre",      from: "+237691234567", name: "Marie Nguemo",   msg: "Bonjour, combien coûte le livre de Maths CM2?" },
  { label: "EN — Bulk order",      from: "+237677890123", name: "James Eko",      msg: "Hello, I want to order 50 copies of English Class 4" },
  { label: "FR — Devenir distrib", from: "+237655432109", name: "Paul Tchoupo",   msg: "Comment devenir distributeur NMI?" },
  { label: "FR — Manuscrit",       from: "+237699876543", name: "Aïcha Bello",    msg: "Je veux soumettre un manuscrit pour publication" },
]

interface Result {
  reply: string
  message: { id: string; from: string; customerName: string | null }
}

export default function WASimulatePage() {
  const [from,   setFrom]   = useState("+237691000000")
  const [name,   setName]   = useState("")
  const [msg,    setMsg]    = useState("")
  const [loading, setLoading] = useState(false)
  const [error,  setError]  = useState("")
  const [result, setResult] = useState<Result | null>(null)

  function fill(q: typeof QUICK_MESSAGES[0]) {
    setFrom(q.from); setName(q.name); setMsg(q.msg); setResult(null); setError("")
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!msg.trim()) { setError("Message is required"); return }
    setLoading(true); setError(""); setResult(null)

    try {
      const res  = await fetch("/api/whatsapp/simulate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ from, customerName: name, message: msg }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Error"); return }
      setResult(data)
    } catch {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 32, maxWidth: 800, margin: "0 auto", fontFamily: "system-ui, -apple-system, sans-serif" }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111", margin: 0 }}>WhatsApp Simulator</h1>
          <p style={{ color: "#6b7280", marginTop: 4, fontSize: 13 }}>Test the AI support agent without a real WhatsApp connection</p>
        </div>
        <Link href="/whatsapp" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>← Dashboard</Link>
      </div>

      {/* Quick tests */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", marginBottom: 8 }}>QUICK TEST MESSAGES</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {QUICK_MESSAGES.map((q, i) => (
            <button
              key={i}
              onClick={() => fill(q)}
              style={{
                padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                background: "#f3f4f6", color: "#374151", border: "none", cursor: "pointer",
              }}
              onMouseEnter={e => { (e.target as HTMLButtonElement).style.background = "#e5e7eb" }}
              onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = "#f3f4f6" }}
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: result ? "1fr 1fr" : "1fr", gap: 24 }}>

        {/* Form */}
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>PHONE NUMBER</label>
                <input value={from} onChange={e => setFrom(e.target.value)} style={inputStyle} placeholder="+237691000000" />
              </div>
              <div>
                <label style={labelStyle}>CUSTOMER NAME</label>
                <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} placeholder="Optional" />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>MESSAGE</label>
                <AIWriteButton
                  value={msg}
                  field="general"
                  language="auto"
                  onWrite={text => setMsg(text)}
                />
              </div>
              <textarea
                value={msg}
                onChange={e => setMsg(e.target.value)}
                placeholder="Type a customer message (French or English)… or type keywords and use AI Write"
                rows={5}
                style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
                required
              />
            </div>

            {error && <div style={{ color: "#dc2626", fontSize: 13 }}>{error}</div>}

            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? "#e5e7eb" : "#25d366", color: loading ? "#9ca3af" : "#fff",
                border: "none", borderRadius: 8, padding: "11px 0", fontSize: 14,
                fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "AI is thinking…" : "▶ Send & Get AI Reply"}
            </button>
          </div>
        </form>

        {/* Result */}
        {result && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Simulated chat */}
            <div style={{ background: "#e5ddd5", borderRadius: 10, padding: 16, minHeight: 200 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 12, textAlign: "center" }}>
                WhatsApp Preview
              </div>

              {/* Customer message */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
                <div style={{
                  background: "#dcf8c6", padding: "8px 12px", borderRadius: "10px 10px 2px 10px",
                  maxWidth: "80%", fontSize: 13, lineHeight: 1.5, boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                }}>
                  {msg}
                  <div style={{ fontSize: 10, color: "#6b7280", textAlign: "right", marginTop: 2 }}>
                    {result.message.from}
                  </div>
                </div>
              </div>

              {/* AI reply */}
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{
                  background: "#fff", padding: "8px 12px", borderRadius: "10px 10px 10px 2px",
                  maxWidth: "80%", fontSize: 13, lineHeight: 1.6, boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                  whiteSpace: "pre-wrap",
                }}>
                  <div style={{ fontSize: 11, color: "#25d366", fontWeight: 700, marginBottom: 4 }}>NMI Education</div>
                  {result.reply}
                </div>
              </div>
            </div>

            <div style={{ fontSize: 12, color: "#9ca3af", textAlign: "center" }}>
              Saved to dashboard · ID: <code style={{ fontSize: 10 }}>{result.message.id.slice(-8)}</code>
            </div>

            <Link href="/whatsapp" style={{ textAlign: "center", fontSize: 13, color: "#25d366", textDecoration: "none", fontWeight: 600 }}>
              View in WhatsApp dashboard →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: "#9ca3af", display: "block", marginBottom: 5 }
const inputStyle: React.CSSProperties = { width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, boxSizing: "border-box" }
