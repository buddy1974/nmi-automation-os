"use client"

import { useState, useRef, useEffect, useCallback } from "react"

interface Suggestion {
  display: string
  street:  string
  city:    string
  region:  string
  zip:     string
}

interface Props {
  value:        string
  onChange:     (value: string) => void
  onSelect?:    (suggestion: Suggestion) => void
  placeholder?: string
  inputStyle?:  React.CSSProperties
}

export default function CameroonAddressInput({
  value, onChange, onSelect, placeholder, inputStyle,
}: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open,        setOpen]        = useState(false)
  const [loading,     setLoading]     = useState(false)
  const debounce      = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) { setSuggestions([]); setOpen(false); return }
    setLoading(true)
    try {
      const res  = await fetch(`/api/address?q=${encodeURIComponent(q)}`)
      const data = await res.json() as { suggestions: Suggestion[] }
      setSuggestions(data.suggestions ?? [])
      if ((data.suggestions ?? []).length > 0) setOpen(true)
    } catch {
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [])

  function handleChange(v: string) {
    onChange(v)
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(() => fetchSuggestions(v), 400)
  }

  function select(s: Suggestion) {
    onChange(s.display)
    setSuggestions([])
    setOpen(false)
    onSelect?.(s)
  }

  // Cleanup debounce on unmount
  useEffect(() => () => { if (debounce.current) clearTimeout(debounce.current) }, [])

  return (
    <div style={{ position: "relative" }}>

      {/* Input */}
      <div style={{ position: "relative" }}>
        <input
          type="text"
          value={value}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 160)}
          placeholder={placeholder ?? "Type city or address in Cameroon..."}
          style={{
            width: "100%", padding: "9px 32px 9px 36px",
            border: "1px solid #e2e8f0", borderRadius: 8,
            fontSize: 14, color: "#1e293b", background: "#fff",
            boxSizing: "border-box", outline: "none",
            ...inputStyle,
          }}
        />
        {/* Map pin icon */}
        <span style={{
          position: "absolute", left: 10, top: "50%",
          transform: "translateY(-50%)", fontSize: 15, pointerEvents: "none",
          lineHeight: 1,
        }}>
          📍
        </span>
        {/* Loading indicator */}
        {loading && (
          <span style={{
            position: "absolute", right: 10, top: "50%",
            transform: "translateY(-50%)", fontSize: 11, color: "#94a3b8",
          }}>
            ...
          </span>
        )}
      </div>

      {/* Dropdown */}
      {open && suggestions.length > 0 && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          zIndex: 200, background: "#fff",
          border: "1px solid #e2e8f0", borderRadius: 8,
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          maxHeight: 220, overflowY: "auto",
        }}>
          {suggestions.map((s, i) => (
            <div
              key={i}
              onMouseDown={() => select(s)}
              style={{
                padding: "10px 14px", cursor: "pointer", fontSize: 13,
                borderBottom: i < suggestions.length - 1 ? "1px solid #f1f5f9" : "none",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "#eff6ff" }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "#fff" }}
            >
              <div style={{ fontWeight: 600, color: "#1e293b" }}>
                {s.city || s.display.split(",")[0]}
              </div>
              {s.region && (
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                  {s.region}, Cameroon
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
