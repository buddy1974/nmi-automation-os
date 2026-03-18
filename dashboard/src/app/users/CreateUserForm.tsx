"use client"

import { useActionState } from "react"
import { createUser }     from "./actions"

const ROLES = ["admin", "manager", "accountant", "editor", "printer", "hr", "viewer"]

export default function CreateUserForm() {

  const [state, action, pending] = useActionState(createUser, null)

  return (
    <div style={{
      background: "#f8f9ff",
      border: "1px solid #e0e4f8",
      borderRadius: "8px",
      padding: "24px",
      marginBottom: "40px",
      maxWidth: "560px",
    }}>

      <h2 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: 700 }}>Create user</h2>

      {state?.error && (
        <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: "6px", padding: "10px 14px", marginBottom: "16px", fontSize: "13px", color: "#dc2626" }}>
          {state.error}
        </div>
      )}
      {state?.success && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "6px", padding: "10px 14px", marginBottom: "16px", fontSize: "13px", color: "#16a34a" }}>
          User created successfully.
        </div>
      )}

      <form action={action} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>

        <div>
          <label style={labelStyle}>Full name</label>
          <input name="name" required placeholder="Jane Doe" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Email</label>
          <input name="email" type="email" required placeholder="jane@nmieducation.com" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Password</label>
          <input name="password" type="password" required placeholder="Min. 6 characters" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Role</label>
          <select name="role" defaultValue="viewer" style={{ ...inputStyle, cursor: "pointer" }}>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <button
            type="submit"
            disabled={pending}
            style={{
              padding: "10px 24px",
              background: pending ? "#9ca3af" : "#1a1a2e",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: pending ? "not-allowed" : "pointer",
            }}
          >
            {pending ? "Creating…" : "Create user"}
          </button>
        </div>

      </form>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 600,
  marginBottom: "5px",
  color: "#374151",
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  fontSize: "13px",
  boxSizing: "border-box",
}
