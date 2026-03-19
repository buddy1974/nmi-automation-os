"use client"

import { useActionState } from "react"
import { createCompany }  from "./actions"

export default function CreateCompanyForm() {
  const [state, action, pending] = useActionState(createCompany, null)

  return (
    <form action={action} style={{ marginBottom: "32px" }}>
      <div style={{
        background: "white", border: "1px solid #e5e7eb", borderRadius: "10px",
        padding: "20px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
      }}>
        <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "16px" }}>Add Company</div>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "11px", color: "#888", fontWeight: 600 }}>COMPANY NAME *</label>
            <input
              name="name"
              required
              placeholder="NMI Yaounde"
              style={{
                border: "1px solid #d1d5db", borderRadius: "6px",
                padding: "8px 12px", fontSize: "13px", width: "220px",
                outline: "none",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "11px", color: "#888", fontWeight: 600 }}>CITY</label>
            <input
              name="city"
              placeholder="Yaounde"
              style={{
                border: "1px solid #d1d5db", borderRadius: "6px",
                padding: "8px 12px", fontSize: "13px", width: "160px",
                outline: "none",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            style={{
              background: pending ? "#9ca3af" : "#111", color: "white",
              border: "none", borderRadius: "6px",
              padding: "8px 20px", fontSize: "13px",
              cursor: pending ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            {pending ? "Creating…" : "Create Company"}
          </button>

        </div>

        {state?.error   && <div style={{ marginTop: "10px", color: "#dc2626", fontSize: "12px" }}>{state.error}</div>}
        {state?.success && <div style={{ marginTop: "10px", color: "#16a34a", fontSize: "12px" }}>Company created successfully.</div>}
      </div>
    </form>
  )
}
