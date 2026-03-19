"use client"

import { updateWorkerCompany, toggleWorkerStatus } from "./actions"

interface Company { id: string; name: string }

interface Props {
  workerId:  number
  status:    string
  companyId: string | null
  companies: Company[]
}

export default function WorkerControls({ workerId, status, companyId, companies }: Props) {

  async function handleCompany(e: React.ChangeEvent<HTMLSelectElement>) {
    await updateWorkerCompany(workerId, e.target.value)
  }

  return (
    <td style={{ padding: "10px 12px", verticalAlign: "middle" }}>
      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>

        {/* Company selector */}
        <select
          defaultValue={companyId ?? "none"}
          onChange={handleCompany}
          style={{
            padding: "4px 8px", border: "1px solid #d1d5db",
            borderRadius: "4px", fontSize: "12px", cursor: "pointer", minWidth: "130px",
          }}
        >
          <option value="none">No company</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        {/* Status toggle */}
        <form action={toggleWorkerStatus.bind(null, workerId)}>
          <button
            type="submit"
            style={{
              padding: "4px 10px", fontSize: "12px", border: "none", borderRadius: "4px",
              cursor: "pointer", fontWeight: 600,
              background: status === "active" ? "#fee2e2" : "#dcfce7",
              color:      status === "active" ? "#dc2626" : "#16a34a",
            }}
          >
            {status === "active" ? "Deactivate" : "Activate"}
          </button>
        </form>

      </div>
    </td>
  )
}
