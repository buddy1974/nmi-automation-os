"use client"

import { useActionState, useRef, useState } from "react"
import { loginAction } from "./actions"

const QUICK_ACCESS = [
  { name: "Rogers Nforgwei", role: "Owner",   email: "rogers@nmi.cm",  password: "nmi2025"    },
  { name: "Admin NMI",       role: "Admin",   email: "admin@nmi.cm",   password: "Admin2024!" },
  { name: "Sales Manager",   role: "Manager", email: "sales@nmi.cm",   password: "nmi2025"    },
  { name: "HR Officer",      role: "Staff",   email: "hr@nmi.cm",      password: "nmi2025"    },
]

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, null)
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const submitRef               = useRef<HTMLButtonElement>(null)

  function fillCredentials(e: string, p: string) {
    setEmail(e)
    setPassword(p)
    setTimeout(() => submitRef.current?.focus(), 0)
  }

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
              value={email}
              onChange={e => setEmail(e.target.value)}
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
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={inputStyle}
            />
          </div>

          <button
            ref={submitRef}
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

          {/* Divider */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            margin: "8px 0 0",
          }}>
            <hr style={{ flex: 1, border: "none", borderTop: "1px solid #e2e8f0", margin: 0 }} />
            <span style={{ fontSize: "11px", color: "#475569", whiteSpace: "nowrap" }}>
              Quick access — click to fill
            </span>
            <hr style={{ flex: 1, border: "none", borderTop: "1px solid #e2e8f0", margin: 0 }} />
          </div>

          {/* Quick access pills */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px",
          }}>
            {QUICK_ACCESS.map(account => (
              <QuickPill
                key={account.email}
                {...account}
                onFill={() => fillCredentials(account.email, account.password)}
              />
            ))}
          </div>

        </form>

      </div>
    </div>
  )
}

function QuickPill({
  name, role, onFill,
}: {
  name: string
  role: string
  onFill: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      type="button"
      onClick={onFill}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "6px 14px",
        background: hovered ? "#1a73e8" : "#1a1a2e",
        border: "1px solid #1a73e8",
        borderRadius: "999px",
        cursor: "pointer",
        transition: "all 0.15s",
        textAlign: "left",
      }}
    >
      <span style={{
        fontSize: "13px",
        fontWeight: 600,
        color: hovered ? "white" : "#e2e8f0",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        minWidth: 0,
      }}>
        {name}
      </span>
      <span style={{
        fontSize: "10px",
        fontFamily: "monospace",
        background: hovered ? "rgba(255,255,255,0.2)" : "rgba(26,115,232,0.15)",
        color: hovered ? "white" : "#1a73e8",
        borderRadius: "4px",
        padding: "1px 6px",
        flexShrink: 0,
      }}>
        {role}
      </span>
    </button>
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
