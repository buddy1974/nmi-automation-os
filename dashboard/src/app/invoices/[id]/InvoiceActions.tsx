"use client"

import { useState } from "react"
import { updateInvoicePayment } from "../actions"

interface Props {
  invoiceId: number
  status: string
}

export default function InvoiceActions({ invoiceId, status }: Props) {

  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState("")

  async function handlePayment() {
    const val = parseFloat(amount)
    if (!val || val <= 0) { setError("Enter a valid amount"); return }
    setLoading(true)
    setError("")
    try {
      await updateInvoicePayment(invoiceId, val)
      setAmount("")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error saving payment")
    } finally {
      setLoading(false)
    }
  }

  const isPaid = status === "paid"

  return (
    <div className="no-print">

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <a href="/invoices" style={{ fontSize: "13px", color: "#555", textDecoration: "none" }}>
          ← Back to invoices
        </a>
        <button
          onClick={() => window.print()}
          style={{
            padding: "8px 20px",
            background: "#1a1a2e",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          Print
        </button>
      </div>

      {/* Payment panel */}
      {!isPaid && (
        <div style={{
          background: "#f8f9ff",
          border: "1px solid #e0e4f8",
          borderRadius: "8px",
          padding: "20px 24px",
          marginBottom: "32px",
          maxWidth: "400px",
        }}>
          <p style={{ margin: "0 0 12px", fontWeight: 600, fontSize: "14px" }}>Add payment</p>

          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="number"
              min="1"
              placeholder="Amount (FCFA)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{
                flex: 1,
                padding: "8px 12px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                fontSize: "14px",
              }}
            />
            <button
              onClick={handlePayment}
              disabled={loading}
              style={{
                padding: "8px 16px",
                background: loading ? "#999" : "#16a34a",
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontSize: "14px",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Saving…" : "Save"}
            </button>
          </div>

          {error && (
            <p style={{ color: "red", margin: "8px 0 0", fontSize: "13px" }}>{error}</p>
          )}
        </div>
      )}

    </div>
  )
}
