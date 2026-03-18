"use client"

import { useActionState } from "react"
import { loginAction }    from "./actions"

export default function LoginPage() {

  const [state, action, pending] = useActionState(loginAction, null)

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f1f5f9",
      fontFamily: "Arial, sans-serif",
    }}>

      <div style={{
        background: "white",
        borderRadius: "12px",
        padding: "48px 40px",
        width: "100%",
        maxWidth: "400px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
      }}>

        {/* Logo / title */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            width: "48px",
            height: "48px",
            background: "#1a1a2e",
            borderRadius: "10px",
            margin: "0 auto 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "22px",
            color: "white",
            fontWeight: 700,
          }}>N</div>
          <h1 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "#1a1a2e" }}>
            NMI Automation OS
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#888" }}>
            Sign in to your account
          </p>
        </div>

        {/* Error */}
        {state?.error && (
          <div style={{
            background: "#fff1f2",
            border: "1px solid #fecdd3",
            borderRadius: "6px",
            padding: "10px 14px",
            marginBottom: "20px",
            fontSize: "13px",
            color: "#dc2626",
          }}>
            {state.error}
          </div>
        )}

        {/* Form */}
        <form action={action} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "#374151" }}>
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@nmieducation.com"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "#374151" }}>
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            style={{
              marginTop: "8px",
              padding: "12px",
              background: pending ? "#9ca3af" : "#1a1a2e",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "15px",
              fontWeight: 600,
              cursor: pending ? "not-allowed" : "pointer",
            }}
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>

        </form>

      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
}
