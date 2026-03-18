"use client"

import { useState } from "react"
import { updateUserRole, toggleUserActive, resetPassword } from "./actions"

const ROLES = ["admin", "manager", "accountant", "editor", "printer", "hr", "viewer"]

interface Props {
  userId:    string
  role:      string
  active:    boolean
  isSelf:    boolean   // prevent deactivating yourself
}

export default function UserControls({ userId, role, active, isSelf }: Props) {

  const [newPw, setNewPw]   = useState("")
  const [pwMsg, setPwMsg]   = useState("")
  const [loading, setLoading] = useState(false)

  async function handleRole(e: React.ChangeEvent<HTMLSelectElement>) {
    await updateUserRole(userId, e.target.value)
  }

  async function handleToggle() {
    if (isSelf) return
    await toggleUserActive(userId)
  }

  async function handleReset() {
    if (!newPw) return
    setLoading(true)
    const res = await resetPassword(userId, newPw)
    setPwMsg(res.error ?? "Password updated.")
    setNewPw("")
    setLoading(false)
  }

  return (
    <td style={{ padding: "10px 12px", display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>

      {/* Role selector */}
      <select
        defaultValue={role}
        onChange={handleRole}
        style={{
          padding: "4px 8px",
          border: "1px solid #d1d5db",
          borderRadius: "4px",
          fontSize: "12px",
          cursor: "pointer",
        }}
      >
        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
      </select>

      {/* Active toggle */}
      <button
        onClick={handleToggle}
        disabled={isSelf}
        title={isSelf ? "Cannot deactivate yourself" : active ? "Deactivate user" : "Activate user"}
        style={{
          padding: "4px 10px",
          fontSize: "12px",
          border: "none",
          borderRadius: "4px",
          cursor: isSelf ? "not-allowed" : "pointer",
          background: active ? "#fee2e2" : "#dcfce7",
          color:      active ? "#dc2626" : "#16a34a",
          fontWeight: 600,
        }}
      >
        {active ? "Deactivate" : "Activate"}
      </button>

      {/* Reset password */}
      <input
        type="password"
        placeholder="New password"
        value={newPw}
        onChange={e => { setNewPw(e.target.value); setPwMsg("") }}
        style={{
          padding: "4px 8px",
          border: "1px solid #d1d5db",
          borderRadius: "4px",
          fontSize: "12px",
          width: "130px",
        }}
      />
      <button
        onClick={handleReset}
        disabled={loading || !newPw}
        style={{
          padding: "4px 10px",
          fontSize: "12px",
          border: "none",
          borderRadius: "4px",
          cursor: loading || !newPw ? "not-allowed" : "pointer",
          background: "#e0e7ff",
          color: "#3730a3",
          fontWeight: 600,
        }}
      >
        Reset
      </button>

      {pwMsg && (
        <span style={{ fontSize: "11px", color: pwMsg.includes("updated") ? "#16a34a" : "#dc2626" }}>
          {pwMsg}
        </span>
      )}

    </td>
  )
}
