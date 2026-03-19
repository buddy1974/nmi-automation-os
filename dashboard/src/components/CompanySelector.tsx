"use client"

import { useRouter }           from "next/navigation"
import { useTransition }       from "react"
import { switchCompanyAction } from "@/app/actions/switchCompany"

interface CompanyOption {
  id:   string
  name: string
  city: string
}

interface Props {
  companies:        CompanyOption[]
  activeCompanyId:  string          // current value ("all" or cuid)
  isOwner:          boolean
  companyName?:     string          // display name for non-owner
}

export default function CompanySelector({ companies, activeCompanyId, isOwner, companyName }: Props) {
  const router        = useRouter()
  const [pending, startTransition] = useTransition()

  // Non-owner: read-only badge
  if (!isOwner) {
    return (
      <div style={{
        display:      "flex",
        alignItems:   "center",
        gap:          "6px",
        fontSize:     "12px",
        color:        "#555",
        background:   "#f3f4f6",
        padding:      "4px 12px",
        borderRadius: "6px",
        border:       "1px solid #e5e7eb",
      }}>
        <span style={{ fontSize: "10px", color: "#888" }}>COMPANY</span>
        <span style={{ fontWeight: 700, color: "#111" }}>{companyName ?? "—"}</span>
      </div>
    )
  }

  // Owner: full dropdown
  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value
    startTransition(async () => {
      await switchCompanyAction(val)
      router.refresh()
    })
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <span style={{ fontSize: "10px", color: "#888", letterSpacing: "0.5px", fontFamily: "Arial, sans-serif" }}>
        COMPANY
      </span>
      <select
        value={activeCompanyId}
        onChange={handleChange}
        disabled={pending}
        style={{
          fontSize:     "13px",
          fontWeight:   600,
          color:        "#111",
          background:   pending ? "#f9fafb" : "white",
          border:       "1px solid #d1d5db",
          borderRadius: "6px",
          padding:      "4px 10px",
          cursor:       "pointer",
          outline:      "none",
          minWidth:     "160px",
          fontFamily:   "Arial, sans-serif",
        }}
      >
        <option value="all">All Companies</option>
        {companies.map(c => (
          <option key={c.id} value={c.id}>
            {c.name}{c.city ? ` — ${c.city}` : ""}
          </option>
        ))}
      </select>
      {pending && (
        <span style={{ fontSize: "11px", color: "#888", fontFamily: "Arial, sans-serif" }}>switching…</span>
      )}
    </div>
  )
}
