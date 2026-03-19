"use client"

import { useActionState } from "react"
import { createWorker }   from "./actions"

const CONTRACT_TYPES = ["CDI", "CDD", "Stage", "Freelance", "Consultant", "Author", "Printer", "Temporary"]

interface Company { id: string; name: string }

export default function WorkerForm({ companies }: { companies: Company[] }) {
  const [state, action, pending] = useActionState(createWorker, null)

  return (
    <form action={action} style={{ marginBottom: "32px" }}>
      <div style={{
        background: "white", border: "1px solid #e5e7eb", borderRadius: "10px",
        padding: "20px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
      }}>
        <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "16px" }}>Add Worker</div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "12px" }}>

          <div>
            <label style={lbl}>Full name *</label>
            <input name="name" required placeholder="John Mbarga" style={inp} />
          </div>

          <div>
            <label style={lbl}>Role / Job title</label>
            <input name="role" placeholder="Editor" style={inp} />
          </div>

          <div>
            <label style={lbl}>Department</label>
            <input name="department" placeholder="Editorial" style={inp} />
          </div>

          <div>
            <label style={lbl}>Contract type</label>
            <select name="contractType" defaultValue="CDI" style={{ ...inp, cursor: "pointer" }}>
              {CONTRACT_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label style={lbl}>Base salary (XAF)</label>
            <input name="salaryBase" type="number" min="0" placeholder="150000" style={inp} />
          </div>

          <div>
            <label style={lbl}>Company</label>
            <select name="companyId" defaultValue="" style={{ ...inp, cursor: "pointer" }}>
              <option value="">— No company —</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

        </div>

        <button
          type="submit"
          disabled={pending}
          style={{
            background: pending ? "#9ca3af" : "#111", color: "white",
            border: "none", borderRadius: "6px",
            padding: "8px 20px", fontSize: "13px",
            cursor: pending ? "not-allowed" : "pointer", fontWeight: 600,
          }}
        >
          {pending ? "Adding…" : "Add Worker"}
        </button>

        {state?.error   && <div style={{ marginTop: "10px", color: "#dc2626",  fontSize: "12px" }}>{state.error}</div>}
        {state?.success && <div style={{ marginTop: "10px", color: "#16a34a",  fontSize: "12px" }}>Worker added successfully.</div>}
      </div>
    </form>
  )
}

const lbl: React.CSSProperties = { display: "block", fontSize: "11px", fontWeight: 600, color: "#555", marginBottom: "4px" }
const inp: React.CSSProperties = { width: "100%", padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }
