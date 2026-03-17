"use client"

import { useState } from "react"

// ── Types ─────────────────────────────────────────────────────────────────────

type WorkerStatus   = "active" | "inactive" | "suspended"
type ContractType   = "CDI" | "CDD" | "Stage" | "Freelance" | "Consultant" | "Author" | "Printer" | "Temporary"
type LeaveType      = "annual" | "sick" | "maternity" | "unpaid" | "other"
type AssignmentType = "manuscript" | "book" | "print" | "order" | "accounting" | "design"
type AssignmentStatus = "assigned" | "working" | "done"
type EvalDecision   = "confirm" | "extend" | "promote" | "warning" | "terminate"
type PaymentType    = "salary" | "bonus" | "royalty" | "freelance" | "allowance" | "deduction"

type Onboarding = {
  manager:        string
  contractSigned: boolean
  cnpsAdded:      boolean
  roleAssigned:   boolean
  tasksAssigned:  boolean
  approved:       boolean
}

type Worker = {
  id:           number
  name:         string
  nationalId:   string
  cnpsNumber:   string
  phone:        string
  email:        string
  role:         string
  department:   string
  contractType: ContractType
  startDate:    string
  endDate:      string
  salaryBase:   number
  status:       WorkerStatus
  onboarding:   Onboarding
  aiReport:     string
}

type Leave = {
  id:         number
  worker:     string
  type:       LeaveType
  start:      string
  end:        string
  approvedBy: string
  paid:       boolean
}

type Assignment = {
  id:     number
  worker: string
  type:   AssignmentType
  target: string
  status: AssignmentStatus
}

type Evaluation = {
  id:       number
  worker:   string
  date:     string
  reviewer: string
  score:    number
  notes:    string
  decision: EvalDecision
}

type Payment = {
  id:     number
  worker: string
  type:   PaymentType
  amount: number
  date:   string
  notes:  string
}

type Employer = {
  companyName:        string
  cnpsEmployerNumber: string
  taxNumber:          string
  address:            string
  phone:              string
  email:              string
}

// ─────────────────────────────────────────────────────────────────────────────

const defaultOnboarding = (): Onboarding => ({
  manager:        "",
  contractSigned: false,
  cnpsAdded:      false,
  roleAssigned:   false,
  tasksAssigned:  false,
  approved:       false
})

export default function HRPage() {

  // ── 10.9.4 Employer settings ───────────────────────────────────────────────
  const [employer, setEmployer] = useState<Employer>({
    companyName:        "NMI Education SARL",
    cnpsEmployerNumber: "",
    taxNumber:          "",
    address:            "",
    phone:              "",
    email:              ""
  })

  // ── 10.9.2 Workers ────────────────────────────────────────────────────────
  const [workers, setWorkers] = useState<Worker[]>([])

  const [wName,     setWName]     = useState("")
  const [wNatId,    setWNatId]    = useState("")
  const [wCnps,     setWCnps]     = useState("")
  const [wPhone,    setWPhone]    = useState("")
  const [wEmail,    setWEmail]    = useState("")
  const [wRole,     setWRole]     = useState("")
  const [wDept,     setWDept]     = useState("")
  const [wContract, setWContract] = useState<ContractType>("CDI")
  const [wStart,    setWStart]    = useState("")
  const [wEnd,      setWEnd]      = useState("")
  const [wSalary,   setWsalary]   = useState("")

  // ── 10.9.6 Leave ──────────────────────────────────────────────────────────
  const [leaves, setLeaves] = useState<Leave[]>([])

  const [lWorker,   setLWorker]   = useState("")
  const [lType,     setLType]     = useState<LeaveType>("annual")
  const [lStart,    setLStart]    = useState("")
  const [lEnd,      setLEnd]      = useState("")
  const [lApprover, setLApprover] = useState("")
  const [lPaid,     setLPaid]     = useState(true)

  // ── 10.9.7 Assignments ────────────────────────────────────────────────────
  const [assignments, setAssignments] = useState<Assignment[]>([])

  const [aWorker, setAWorker] = useState("")
  const [aType,   setAType]   = useState<AssignmentType>("manuscript")
  const [aTarget, setATarget] = useState("")

  // ── 10.9.8 Evaluations ────────────────────────────────────────────────────
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])

  const [eWorker,   setEWorker]   = useState("")
  const [eReviewer, setEReviewer] = useState("")
  const [eScore,    setEScore]    = useState("")
  const [eNotes,    setENotes]    = useState("")
  const [eDecision, setEDecision] = useState<EvalDecision>("confirm")

  // ── 10.9.9 Payments ───────────────────────────────────────────────────────
  const [payments, setPayments] = useState<Payment[]>([])

  const [pWorker, setPWorker] = useState("")
  const [pType,   setPType]   = useState<PaymentType>("salary")
  const [pAmount, setPAmount] = useState("")
  const [pNotes,  setPNotes]  = useState("")


  // ── Functions ─────────────────────────────────────────────────────────────

  function addWorker() {
    if (!wName) return
    const newWorker: Worker = {
      id:           Date.now(),
      name:         wName,
      nationalId:   wNatId,
      cnpsNumber:   wCnps,
      phone:        wPhone,
      email:        wEmail,
      role:         wRole,
      department:   wDept,
      contractType: wContract,
      startDate:    wStart,
      endDate:      wEnd,
      salaryBase:   Number(wSalary),
      status:       "active",
      onboarding:   defaultOnboarding(),
      aiReport:     ""
    }
    setWorkers([...workers, newWorker])
    setWName(""); setWNatId(""); setWCnps(""); setWPhone(""); setWEmail("")
    setWRole(""); setWDept(""); setWStart(""); setWEnd(""); setWsalary("")
  }

  function updateOnboarding(id: number, patch: Partial<Onboarding>) {
    setWorkers(workers.map(w =>
      w.id === id ? { ...w, onboarding: { ...w.onboarding, ...patch } } : w
    ))
  }

  function setWorkerStatus(id: number, status: WorkerStatus) {
    setWorkers(workers.map(w => w.id === id ? { ...w, status } : w))
  }

  function addLeave() {
    if (!lWorker) return
    setLeaves([...leaves, {
      id: Date.now(), worker: lWorker, type: lType,
      start: lStart, end: lEnd, approvedBy: lApprover, paid: lPaid
    }])
    setLWorker(""); setLStart(""); setLEnd(""); setLApprover("")
  }

  function addAssignment() {
    if (!aWorker) return
    setAssignments([...assignments, {
      id: Date.now(), worker: aWorker, type: aType, target: aTarget, status: "assigned"
    }])
    setAWorker(""); setATarget("")
  }

  function setAssignmentStatus(id: number, status: AssignmentStatus) {
    setAssignments(assignments.map(a => a.id === id ? { ...a, status } : a))
  }

  function addEvaluation() {
    if (!eWorker) return
    setEvaluations([...evaluations, {
      id: Date.now(), worker: eWorker, date: new Date().toLocaleDateString(),
      reviewer: eReviewer, score: Number(eScore), notes: eNotes, decision: eDecision
    }])
    setEWorker(""); setEReviewer(""); setEScore(""); setENotes("")
  }

  function addPayment() {
    if (!pWorker) return
    setPayments([...payments, {
      id: Date.now(), worker: pWorker, type: pType,
      amount: Number(pAmount), date: new Date().toLocaleDateString(), notes: pNotes
    }])
    setPWorker(""); setPAmount(""); setPNotes("")
  }


  // ── 10.9.10 AI Assist ─────────────────────────────────────────────────────

  function aiOnboard(id: number) {
    setWorkers(workers.map(w => {
      if (w.id !== id) return w
      return {
        ...w,
        aiReport:
          "Onboarding check for " + w.name + ":\n" +
          "Contract type: " + w.contractType + "\n" +
          "CNPS required: " + (["CDI","CDD"].includes(w.contractType) ? "Yes" : "No") + "\n" +
          "Recommended department: " + (w.role ? w.role : "Unassigned") + "\n" +
          "Action: Send welcome email and assign manager."
      }
    }))
  }

  function aiEvaluation(id: number) {
    setWorkers(workers.map(w => {
      if (w.id !== id) return w
      const evals = evaluations.filter(e => e.worker === w.name)
      const avg = evals.length
        ? (evals.reduce((s, e) => s + e.score, 0) / evals.length).toFixed(1)
        : "No data"
      return {
        ...w,
        aiReport:
          "Evaluation summary for " + w.name + ":\n" +
          "Evaluations on record: " + evals.length + "\n" +
          "Average score: " + avg + "\n" +
          "Recommendation: " + (Number(avg) >= 7 ? "Confirm / Promote" : "Review contract")
      }
    }))
  }

  function aiAssignment(id: number) {
    setWorkers(workers.map(w => {
      if (w.id !== id) return w
      const active = assignments.filter(a => a.worker === w.name && a.status !== "done").length
      return {
        ...w,
        aiReport:
          "Assignment analysis for " + w.name + ":\n" +
          "Active assignments: " + active + "\n" +
          "Capacity: " + (active < 3 ? "Available" : "At capacity") + "\n" +
          "Suggested next: " + (w.contractType === "Author" ? "manuscript" : "book")
      }
    }))
  }

  function aiCheckCompliance(id: number) {
    setWorkers(workers.map(w => {
      if (w.id !== id) return w
      const issues: string[] = []
      if (!w.cnpsNumber && ["CDI","CDD"].includes(w.contractType)) issues.push("CNPS number missing")
      if (!w.nationalId) issues.push("National ID missing")
      if (!w.startDate)  issues.push("Start date missing")
      if (!w.role)       issues.push("Role unassigned")
      return {
        ...w,
        aiReport:
          "Compliance check — " + w.name + ":\n" +
          (issues.length ? issues.join("\n") : "All checks passed ✓")
      }
    }))
  }


  // ── 10.9.11 Reports (computed) ────────────────────────────────────────────

  const activeWorkers  = workers.filter(w => w.status === "active").length
  const totalSalary    = workers.filter(w => w.status === "active").reduce((s, w) => s + w.salaryBase, 0)
  const totalFreelance = payments.filter(p => p.type === "freelance").reduce((s, p) => s + p.amount, 0)
  const totalRoyalties = payments.filter(p => p.type === "royalty").reduce((s, p) => s + p.amount, 0)


  // ── Render ────────────────────────────────────────────────────────────────

  return (

    <div>

      <h1>HR / PeopleOS</h1>


      {/* ── Employer settings ─────────────────────────────────────────────── */}

      <h2>Employer</h2>

      <input placeholder="Company name"         value={employer.companyName}        onChange={e => setEmployer({ ...employer, companyName:        e.target.value })} />
      <input placeholder="CNPS employer number" value={employer.cnpsEmployerNumber} onChange={e => setEmployer({ ...employer, cnpsEmployerNumber: e.target.value })} />
      <input placeholder="Tax number"           value={employer.taxNumber}          onChange={e => setEmployer({ ...employer, taxNumber:          e.target.value })} />
      <input placeholder="Address"              value={employer.address}            onChange={e => setEmployer({ ...employer, address:            e.target.value })} />
      <input placeholder="Phone"                value={employer.phone}              onChange={e => setEmployer({ ...employer, phone:              e.target.value })} />
      <input placeholder="Email"                value={employer.email}              onChange={e => setEmployer({ ...employer, email:              e.target.value })} />


      {/* ── Workers ───────────────────────────────────────────────────────── */}

      <h2>Add Worker</h2>

      <input placeholder="Full name"    value={wName}  onChange={e => setWName(e.target.value)} />
      <input placeholder="National ID"  value={wNatId} onChange={e => setWNatId(e.target.value)} />
      <input placeholder="CNPS number"  value={wCnps}  onChange={e => setWCnps(e.target.value)} />
      <input placeholder="Phone"        value={wPhone} onChange={e => setWPhone(e.target.value)} />
      <input placeholder="Email"        value={wEmail} onChange={e => setWEmail(e.target.value)} />
      <input placeholder="Role"         value={wRole}  onChange={e => setWRole(e.target.value)} />
      <input placeholder="Department"   value={wDept}  onChange={e => setWDept(e.target.value)} />
      <input placeholder="Start date"   value={wStart} onChange={e => setWStart(e.target.value)} />
      <input placeholder="End date"     value={wEnd}   onChange={e => setWEnd(e.target.value)} />
      <input placeholder="Base salary"  value={wSalary} onChange={e => setWsalary(e.target.value)} />

      <select value={wContract} onChange={e => setWContract(e.target.value as ContractType)}>
        {(["CDI","CDD","Stage","Freelance","Consultant","Author","Printer","Temporary"] as ContractType[]).map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <button onClick={addWorker}>Add Worker</button>

      <h2>Workers</h2>

      {workers.map(w => (
        <div key={w.id}>

          <b>{w.name}</b> — {w.role} — {w.department} — {w.contractType} — {w.status}

          <div>
            <button onClick={() => setWorkerStatus(w.id, "active")}>Active</button>
            <button onClick={() => setWorkerStatus(w.id, "inactive")}>Inactive</button>
            <button onClick={() => setWorkerStatus(w.id, "suspended")}>Suspend</button>
          </div>

          <div>
            <b>Onboarding:</b>
            <label><input type="checkbox" checked={w.onboarding.contractSigned} onChange={e => updateOnboarding(w.id, { contractSigned: e.target.checked })} /> Contract signed</label>
            <label><input type="checkbox" checked={w.onboarding.cnpsAdded}      onChange={e => updateOnboarding(w.id, { cnpsAdded:      e.target.checked })} /> CNPS added</label>
            <label><input type="checkbox" checked={w.onboarding.roleAssigned}   onChange={e => updateOnboarding(w.id, { roleAssigned:   e.target.checked })} /> Role assigned</label>
            <label><input type="checkbox" checked={w.onboarding.tasksAssigned}  onChange={e => updateOnboarding(w.id, { tasksAssigned:  e.target.checked })} /> Tasks assigned</label>
            <label><input type="checkbox" checked={w.onboarding.approved}       onChange={e => updateOnboarding(w.id, { approved:       e.target.checked })} /> Approved</label>
          </div>

          <div>
            <button onClick={() => aiOnboard(w.id)}>AI Onboard</button>
            <button onClick={() => aiEvaluation(w.id)}>AI Evaluate</button>
            <button onClick={() => aiAssignment(w.id)}>AI Assign</button>
            <button onClick={() => aiCheckCompliance(w.id)}>AI Compliance</button>
          </div>

          {w.aiReport && <pre>{w.aiReport}</pre>}

        </div>
      ))}


      {/* ── Leave ─────────────────────────────────────────────────────────── */}

      <h2>Leave</h2>

      <input placeholder="Worker"      value={lWorker}   onChange={e => setLWorker(e.target.value)} />
      <input placeholder="Start"       value={lStart}    onChange={e => setLStart(e.target.value)} />
      <input placeholder="End"         value={lEnd}      onChange={e => setLEnd(e.target.value)} />
      <input placeholder="Approved by" value={lApprover} onChange={e => setLApprover(e.target.value)} />

      <select value={lType} onChange={e => setLType(e.target.value as LeaveType)}>
        {(["annual","sick","maternity","unpaid","other"] as LeaveType[]).map(t => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>

      <label><input type="checkbox" checked={lPaid} onChange={e => setLPaid(e.target.checked)} /> Paid</label>

      <button onClick={addLeave}>Add Leave</button>

      {leaves.map(l => (
        <div key={l.id}>
          {l.worker} — {l.type} — {l.start} → {l.end} — approved: {l.approvedBy} — paid: {l.paid ? "yes" : "no"}
        </div>
      ))}


      {/* ── Assignments ───────────────────────────────────────────────────── */}

      <h2>Assignments</h2>

      <input placeholder="Worker" value={aWorker} onChange={e => setAWorker(e.target.value)} />
      <input placeholder="Target" value={aTarget} onChange={e => setATarget(e.target.value)} />

      <select value={aType} onChange={e => setAType(e.target.value as AssignmentType)}>
        {(["manuscript","book","print","order","accounting","design"] as AssignmentType[]).map(t => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>

      <button onClick={addAssignment}>Add Assignment</button>

      {assignments.map(a => (
        <div key={a.id}>
          {a.worker} — {a.type} — {a.target} — <b>{a.status}</b>
          <button onClick={() => setAssignmentStatus(a.id, "working")}>Working</button>
          <button onClick={() => setAssignmentStatus(a.id, "done")}>Done</button>
        </div>
      ))}


      {/* ── Evaluations ───────────────────────────────────────────────────── */}

      <h2>Evaluations</h2>

      <input placeholder="Worker"   value={eWorker}   onChange={e => setEWorker(e.target.value)} />
      <input placeholder="Reviewer" value={eReviewer} onChange={e => setEReviewer(e.target.value)} />
      <input placeholder="Score /10" value={eScore}   onChange={e => setEScore(e.target.value)} />
      <input placeholder="Notes"    value={eNotes}    onChange={e => setENotes(e.target.value)} />

      <select value={eDecision} onChange={e => setEDecision(e.target.value as EvalDecision)}>
        {(["confirm","extend","promote","warning","terminate"] as EvalDecision[]).map(d => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      <button onClick={addEvaluation}>Add Evaluation</button>

      {evaluations.map(ev => (
        <div key={ev.id}>
          {ev.worker} — {ev.date} — score: {ev.score}/10 — {ev.decision} — {ev.notes}
        </div>
      ))}


      {/* ── Payments ──────────────────────────────────────────────────────── */}

      <h2>Payments</h2>

      <input placeholder="Worker" value={pWorker} onChange={e => setPWorker(e.target.value)} />
      <input placeholder="Amount" value={pAmount} onChange={e => setPAmount(e.target.value)} />
      <input placeholder="Notes"  value={pNotes}  onChange={e => setPNotes(e.target.value)} />

      <select value={pType} onChange={e => setPType(e.target.value as PaymentType)}>
        {(["salary","bonus","royalty","freelance","allowance","deduction"] as PaymentType[]).map(t => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>

      <button onClick={addPayment}>Add Payment</button>

      {payments.map(p => (
        <div key={p.id}>
          {p.worker} — {p.type} — {p.amount} — {p.date} — {p.notes}
        </div>
      ))}


      {/* ── Reports ───────────────────────────────────────────────────────── */}

      <h2>Reports</h2>

      <table>
        <tbody>
          <tr><td>Total workers</td><td>{workers.length}</td></tr>
          <tr><td>Active workers</td><td>{activeWorkers}</td></tr>
          <tr><td>Total base salary</td><td>{totalSalary}</td></tr>
          <tr><td>Total freelance paid</td><td>{totalFreelance}</td></tr>
          <tr><td>Total royalties paid</td><td>{totalRoyalties}</td></tr>
        </tbody>
      </table>

    </div>

  )

}
