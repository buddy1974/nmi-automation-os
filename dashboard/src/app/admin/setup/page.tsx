"use client"

import { useEffect, useState, useCallback } from "react"
import CameroonAddressInput from "@/app/components/CameroonAddressInput"

// ── Types ─────────────────────────────────────────────────────────────────────

interface SystemHealth {
  companies:          number
  users:              number
  workers:            number
  products:           number
  customers:          number
  authors:            number
  googleConnected:    boolean
  whatsappConfigured: boolean
  aiConfigured:       boolean
}

// ── Styles ────────────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background:   "#1e293b",
  border:       "1px solid #334155",
  borderRadius: 10,
  padding:      "24px 28px",
  marginBottom: 20,
}

const input: React.CSSProperties = {
  width:        "100%",
  background:   "#0f172a",
  border:       "1px solid #334155",
  borderRadius: 8,
  padding:      "10px 14px",
  color:        "#f1f5f9",
  fontSize:     14,
  boxSizing:    "border-box" as const,
  marginBottom: 12,
}

const btn = (variant: "primary" | "secondary"): React.CSSProperties => ({
  padding:      "10px 22px",
  borderRadius: 8,
  border:       "none",
  cursor:       "pointer",
  fontSize:     14,
  fontWeight:   700,
  background:   variant === "primary" ? "#1a73e8" : "#334155",
  color:        "#fff",
})

const STEPS = ["Company Setup", "Create Admin", "Import Data", "Configure AI", "Go Live"]

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #1e293b" }}>
      <span style={{ fontSize: 16 }}>{ok ? "✅" : "⭕"}</span>
      <span style={{ color: ok ? "#22c55e" : "#94a3b8", fontSize: 14 }}>{label}</span>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function SetupPage() {
  const [step,    setStep]   = useState(1)
  const [health,  setHealth] = useState<SystemHealth | null>(null)
  const [saving,  setSaving] = useState(false)
  const [msg,     setMsg]    = useState("")

  // Step 1 — Company
  const [coName, setCoName] = useState("")
  const [coCity, setCoCity] = useState("")

  // Step 2 — Admin user
  const [uName,  setUName]  = useState("")
  const [uEmail, setUEmail] = useState("")
  const [uPass,  setUPass]  = useState("")

  // Step 4 — AI test
  const [aiOk,   setAiOk]  = useState<boolean | null>(null)
  const [aiMsg,  setAiMsg] = useState("")

  const loadHealth = useCallback(async () => {
    const res  = await fetch("/api/setup")
    const data = await res.json() as SystemHealth
    setHealth(data)
  }, [])

  useEffect(() => { loadHealth() }, [loadHealth])

  async function apiCall(action: string, extra: Record<string, string> = {}) {
    setSaving(true); setMsg("")
    const res  = await fetch("/api/setup", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ action, ...extra }),
    })
    const data = await res.json()
    setSaving(false)
    if (data.error) { setMsg(data.error); return false }
    await loadHealth()
    return true
  }

  async function handleCompany() {
    if (!coName.trim()) { setMsg("Company name is required"); return }
    const ok = await apiCall("create_company", { name: coName, city: coCity })
    if (ok) { setMsg("Company created!"); setTimeout(() => { setMsg(""); setStep(2) }, 1000) }
  }

  async function handleAdmin() {
    if (!uName || !uEmail || !uPass) { setMsg("All fields required"); return }
    const ok = await apiCall("create_admin", { name: uName, email: uEmail, password: uPass })
    if (ok) { setMsg("Admin user created!"); setTimeout(() => { setMsg(""); setStep(3) }, 1000) }
  }

  async function testAI() {
    setSaving(true)
    const res  = await fetch("/api/setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "test_ai" }) })
    const data = await res.json()
    setAiOk(data.ok)
    setAiMsg(data.ok ? `Connected — model: ${data.model}` : (data.error ?? "Connection failed"))
    setSaving(false)
  }

  const allGreen = health && health.companies > 0 && health.users > 0 && health.aiConfigured && health.googleConnected

  return (
    <div style={{ padding: "28px 32px", maxWidth: 780, margin: "0 auto", color: "#f1f5f9" }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>First-Time Setup</h1>
        <p style={{ color: "#64748b", margin: "6px 0 0", fontSize: 14 }}>
          Walk through each step to get NMI Automation OS fully operational.
        </p>
      </div>

      {/* Step tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 28, flexWrap: "wrap" }}>
        {STEPS.map((label, i) => (
          <button
            key={i}
            onClick={() => { setMsg(""); setStep(i + 1) }}
            style={{
              padding:      "6px 14px",
              borderRadius: 6,
              border:       "none",
              cursor:       "pointer",
              fontSize:     12,
              fontWeight:   step === i + 1 ? 700 : 400,
              background:   step === i + 1 ? "#1a73e8" : "#1e293b",
              color:        step === i + 1 ? "#fff" : "#64748b",
            }}
          >
            {i + 1}. {label}
          </button>
        ))}
      </div>

      {/* ── STEP 1 — Company ─────────────────────────────────────────────── */}
      {step === 1 && (
        <div style={card}>
          <h2 style={{ margin: "0 0 20px", fontSize: 17 }}>Step 1 — Company Setup</h2>
          {health?.companies ? (
            <div style={{ background: "#14532d33", border: "1px solid #166534", borderRadius: 6, padding: "10px 14px", marginBottom: 16, color: "#22c55e", fontSize: 13 }}>
              ✅ {health.companies} company record{health.companies > 1 ? "s" : ""} already exist. You can add another below.
            </div>
          ) : null}
          <input style={input} placeholder="Company name *" value={coName} onChange={e => setCoName(e.target.value)} />
          <CameroonAddressInput
            value={coCity}
            onChange={setCoCity}
            onSelect={s => setCoCity(s.city || s.display)}
            placeholder="City (e.g. Yaoundé)"
            inputStyle={{ ...input, marginBottom: 12, padding: "10px 14px 10px 36px" }}
          />
          {msg && <div style={{ color: msg.includes("!") ? "#22c55e" : "#f87171", fontSize: 13, marginBottom: 10 }}>{msg}</div>}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleCompany} disabled={saving} style={btn("primary")}>{saving ? "Saving…" : "Create Company"}</button>
            <button onClick={() => setStep(2)} style={btn("secondary")}>Skip →</button>
          </div>
        </div>
      )}

      {/* ── STEP 2 — Create Admin ────────────────────────────────────────── */}
      {step === 2 && (
        <div style={card}>
          <h2 style={{ margin: "0 0 20px", fontSize: 17 }}>Step 2 — Create First Admin User</h2>
          {health?.users ? (
            <div style={{ background: "#14532d33", border: "1px solid #166534", borderRadius: 6, padding: "10px 14px", marginBottom: 16, color: "#22c55e", fontSize: 13 }}>
              ✅ {health.users} user{health.users > 1 ? "s" : ""} already exist. You can add another below.
            </div>
          ) : null}
          <input style={input} placeholder="Full name *" value={uName} onChange={e => setUName(e.target.value)} />
          <input style={input} placeholder="Email address *" type="email" value={uEmail} onChange={e => setUEmail(e.target.value)} />
          <input style={input} placeholder="Password *" type="password" value={uPass} onChange={e => setUPass(e.target.value)} />
          <p style={{ color: "#64748b", fontSize: 12, margin: "0 0 16px" }}>Role will be set to admin. The user can log in immediately.</p>
          {msg && <div style={{ color: msg.includes("!") ? "#22c55e" : "#f87171", fontSize: 13, marginBottom: 10 }}>{msg}</div>}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleAdmin} disabled={saving} style={btn("primary")}>{saving ? "Creating…" : "Create Admin User"}</button>
            <button onClick={() => setStep(3)} style={btn("secondary")}>Skip →</button>
          </div>
        </div>
      )}

      {/* ── STEP 3 — Import Data ─────────────────────────────────────────── */}
      {step === 3 && (
        <div style={card}>
          <h2 style={{ margin: "0 0 8px", fontSize: 17 }}>Step 3 — Import Your Data</h2>
          <p style={{ color: "#64748b", fontSize: 13, margin: "0 0 20px" }}>
            Use the Import Center to migrate data from Excel, CSV, or Google Sheets. Click any module below.
          </p>

          {[
            { module: "workers",      label: "Workers",      count: health?.workers,   href: "/import?module=workers"      },
            { module: "products",     label: "Products",     count: health?.products,  href: "/import?module=products"     },
            { module: "customers",    label: "Customers",    count: health?.customers, href: "/import?module=customers"    },
            { module: "authors",      label: "Authors",      count: health?.authors,   href: "/import?module=authors"      },
            { module: "royalties",    label: "Royalties",    count: undefined,          href: "/import?module=royalties"    },
            { module: "orders",       label: "Orders",       count: undefined,          href: "/import?module=orders"       },
            { module: "distributors", label: "Distributors", count: undefined,          href: "/import?module=distributors" },
          ].map(({ label, count, href }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #1e293b" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16 }}>{count !== undefined && count > 0 ? "✅" : "⭕"}</span>
                <span style={{ fontSize: 14 }}>{label}</span>
                {count !== undefined && <span style={{ color: "#64748b", fontSize: 12 }}>({count} records)</span>}
              </div>
              <a href={href} style={{ border: "1px solid #1a73e8", color: "#1a73e8", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                ↑ Import
              </a>
            </div>
          ))}

          <div style={{ marginTop: 20 }}>
            <button onClick={() => setStep(4)} style={btn("primary")}>Continue →</button>
          </div>
        </div>
      )}

      {/* ── STEP 4 — Configure AI ────────────────────────────────────────── */}
      {step === 4 && (
        <div style={card}>
          <h2 style={{ margin: "0 0 20px", fontSize: 17 }}>Step 4 — Configure AI & Integrations</h2>

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "#94a3b8" }}>ANTHROPIC AI</h3>
            <Check ok={!!health?.aiConfigured} label="ANTHROPIC_API_KEY is set in environment" />
            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={testAI} disabled={saving} style={btn("secondary")}>{saving ? "Testing…" : "Test AI Connection"}</button>
              {aiOk !== null && (
                <span style={{ color: aiOk ? "#22c55e" : "#f87171", fontSize: 13 }}>
                  {aiOk ? "✅" : "❌"} {aiMsg}
                </span>
              )}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "#94a3b8" }}>GOOGLE CALENDAR & GMAIL</h3>
            <Check ok={!!health?.googleConnected} label="Google account connected (GoogleToken exists)" />
            {!health?.googleConnected && (
              <a href="/api/auth/google" style={{ display: "inline-block", marginTop: 10, border: "1px solid #1a73e8", color: "#1a73e8", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                Connect Google Account →
              </a>
            )}
          </div>

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "#94a3b8" }}>WHATSAPP BUSINESS</h3>
            <Check ok={!!health?.whatsappConfigured} label="WHATSAPP_ACCESS_TOKEN + WHATSAPP_PHONE_ID are set" />
            {!health?.whatsappConfigured && (
              <p style={{ color: "#64748b", fontSize: 12, marginTop: 8 }}>
                Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_ID in your environment variables to enable WhatsApp integration.
              </p>
            )}
          </div>

          <button onClick={() => setStep(5)} style={btn("primary")}>Continue →</button>
        </div>
      )}

      {/* ── STEP 5 — Go Live ─────────────────────────────────────────────── */}
      {step === 5 && (
        <div style={card}>
          <h2 style={{ margin: "0 0 20px", fontSize: 17 }}>Step 5 — System Health Check</h2>

          <Check ok={(health?.companies ?? 0) > 0}  label={`Company configured (${health?.companies ?? 0} found)`} />
          <Check ok={(health?.users ?? 0) > 0}       label={`Admin user exists (${health?.users ?? 0} users)`} />
          <Check ok={(health?.workers ?? 0) > 0}    label={`Workers imported (${health?.workers ?? 0} records)`} />
          <Check ok={(health?.products ?? 0) > 0}   label={`Products imported (${health?.products ?? 0} records)`} />
          <Check ok={(health?.customers ?? 0) > 0}  label={`Customers imported (${health?.customers ?? 0} records)`} />
          <Check ok={!!health?.aiConfigured}         label="Anthropic AI configured" />
          <Check ok={!!health?.googleConnected}      label="Google Calendar + Gmail connected" />
          <Check ok={!!health?.whatsappConfigured}   label="WhatsApp Business configured" />

          <div style={{ marginTop: 28, padding: "20px 24px", background: allGreen ? "#14532d33" : "#1e293b", border: `1px solid ${allGreen ? "#166534" : "#334155"}`, borderRadius: 8, textAlign: "center" }}>
            {allGreen ? (
              <>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🚀</div>
                <div style={{ fontWeight: 700, fontSize: 18, color: "#22c55e", marginBottom: 6 }}>Your NMI Automation OS is ready!</div>
                <p style={{ color: "#94a3b8", fontSize: 13, margin: "0 0 16px" }}>All systems operational. You can now hand over to the NMI team.</p>
                <a href="/dashboard" style={{ display: "inline-block", background: "#1a73e8", color: "#fff", padding: "10px 28px", borderRadius: 8, textDecoration: "none", fontWeight: 700 }}>
                  Go to Dashboard →
                </a>
              </>
            ) : (
              <>
                <div style={{ fontSize: 30, marginBottom: 10 }}>⚠️</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#f59e0b", marginBottom: 6 }}>Some items need attention</div>
                <p style={{ color: "#94a3b8", fontSize: 13, margin: "0 0 16px" }}>Complete the steps above before going live. You can still use the system in the meantime.</p>
                <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                  <button onClick={loadHealth} style={btn("secondary")}>↺ Refresh Status</button>
                  <a href="/dashboard" style={{ display: "inline-block", background: "#334155", color: "#fff", padding: "10px 20px", borderRadius: 8, textDecoration: "none", fontWeight: 600 }}>
                    Go to Dashboard Anyway
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
