"use client"

import { useState } from "react"
import CameroonAddressInput from "./CameroonAddressInput"

interface Suggestion {
  display: string
  street:  string
  city:    string
  region:  string
  zip:     string
}

/** Standalone city search widget for server-component pages. */
export default function CitySearch() {
  const [value,    setValue]    = useState("")
  const [selected, setSelected] = useState<Suggestion | null>(null)

  return (
    <div style={{ maxWidth: 360, marginBottom: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>
        Cameroon City Lookup
      </div>
      <CameroonAddressInput
        value={value}
        onChange={v => { setValue(v); setSelected(null) }}
        onSelect={s => setSelected(s)}
      />
      {selected && (
        <div style={{
          marginTop: 8, padding: "8px 12px",
          background: "#eff6ff", borderRadius: 6,
          fontSize: 12, color: "#1d4ed8", fontWeight: 600,
        }}>
          📍 {selected.city} — {selected.region}
        </div>
      )}
    </div>
  )
}
