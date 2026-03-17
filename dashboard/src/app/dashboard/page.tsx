"use client"

import { useState } from "react"
import Link from "next/link"

// ── Demo seed data (replaced by shared store / DB in Phase 12) ────────────────

const seedBooks = [
  { id: "p-eng-1", code: "P-ENG-1",  title: "English, Class 1",      stock: 4  },
  { id: "p-fr-2",  code: "P-FR-2",   title: "French, Class 2",       stock: 0  },
  { id: "p-math-3",code: "P-MATH-3", title: "Mathematics, Class 3",  stock: 12 },
  { id: "p-sci-4", code: "P-SCI-4",  title: "Sciences, Class 4",     stock: 7  },
  { id: "p-soc-5", code: "P-SOC-5",  title: "Social Studies, Class 5", stock: 22 },
]

const seedOrders = [
  { id: 1, number: "ORD-001", customer: "School A", total: 25000, date: "17/03/2026" },
  { id: 2, number: "ORD-002", customer: "Bookshop B", total: 12500, date: "17/03/2026" },
  { id: 3, number: "ORD-003", customer: "Parent C",   total: 5000,  date: "17/03/2026" },
]

const seedManuscripts = [
  { id: 1, title: "English Draft v2", author: "Author A", status: "ready_for_print" },
  { id: 2, title: "Maths New Edition", author: "Author B", status: "editing"         },
  { id: 3, title: "French Workbook",   author: "Author C", status: "ready_for_print" },
]

const seedRoyalties = [
  { id: 1, author: "Author A", book: "English, Class 1", amount: 5000,  paid: false },
  { id: 2, author: "Author B", book: "Maths, Class 3",   amount: 3500,  paid: true  },
  { id: 3, author: "Author C", book: "French, Class 2",  amount: 2500,  paid: false },
]

const seedWorkers = [
  { id: 1, name: "Alice Ngo",    cnpsNumber: "",     salaryBase: 150000, contractType: "CDI"      },
  { id: 2, name: "Bob Mbarga",   cnpsNumber: "CN001", salaryBase: 0,      contractType: "Freelance" },
  { id: 3, name: "Claire Ateba", cnpsNumber: "",     salaryBase: 120000, contractType: "CDD"      },
]

const seedSales    = 42500
const seedCosts    = 18000
const seedRoyTotal = 11000

// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardPage() {

  const [aiSummary, setAiSummary] = useState("")


  // ── 11.7 AI summary ───────────────────────────────────────────────────────

  function aiDashboard() {

    const lowStock     = seedBooks.filter(b => b.stock < 10)
    const printReady   = seedManuscripts.filter(m => m.status === "ready_for_print")
    const unpaidRoy    = seedRoyalties.filter(r => !r.paid)
    const missingCnps  = seedWorkers.filter(w => !w.cnpsNumber && ["CDI","CDD"].includes(w.contractType))

    const lines = [
      "=== AI System Summary ===",
      "",
      lowStock.length
        ? "⚠ Low stock: " + lowStock.map(b => b.code).join(", ")
        : "✓ Stock levels OK",

      printReady.length
        ? "⚠ Print needed: " + printReady.map(m => m.title).join(", ")
        : "✓ No manuscripts pending print",

      unpaidRoy.length
        ? "⚠ Royalties unpaid: " + unpaidRoy.map(r => r.author).join(", ")
        : "✓ All royalties settled",

      missingCnps.length
        ? "⚠ CNPS missing: " + missingCnps.map(w => w.name).join(", ")
        : "✓ HR compliance OK",

      "",
      "Profit estimate: " + (seedSales - seedCosts - seedRoyTotal)
    ]

    setAiSummary(lines.join("\n"))

  }


  // ── Computed KPIs ─────────────────────────────────────────────────────────

  const totalStock     = seedBooks.reduce((s, b) => s + b.stock, 0)
  const lowStockBooks  = seedBooks.filter(b => b.stock < 10)
  const printReady     = seedManuscripts.filter(m => m.status === "ready_for_print")
  const unpaidRoyalties = seedRoyalties.filter(r => !r.paid)
  const missingCnps    = seedWorkers.filter(w => !w.cnpsNumber && ["CDI","CDD"].includes(w.contractType))
  const missingSalary  = seedWorkers.filter(w => w.salaryBase === 0 && w.contractType === "CDI")
  const totalProfit    = seedSales - seedCosts - seedRoyTotal


  // ── Render ────────────────────────────────────────────────────────────────

  return (

    <div>

      <h1>Dashboard</h1>


      {/* ── 11.7 AI Summary ─────────────────────────────────────────────── */}

      <button onClick={aiDashboard}>AI System Summary</button>

      {aiSummary && <pre>{aiSummary}</pre>}


      {/* ── 11.8 Quick links ────────────────────────────────────────────── */}

      <h2>Quick Links</h2>

      <div>
        <Link href="/orders">      <button>Go Orders</button>      </Link>
        <Link href="/stock">       <button>Go Stock</button>       </Link>
        <Link href="/manuscripts"> <button>Go Manuscripts</button> </Link>
        <Link href="/printing">    <button>Go Printing</button>    </Link>
        <Link href="/accounting">  <button>Go Accounting</button>  </Link>
        <Link href="/hr">          <button>Go HR</button>          </Link>
        <Link href="/customers">   <button>Go Customers</button>   </Link>
        <Link href="/royalties">   <button>Go Royalties</button>   </Link>
        <Link href="/authors">     <button>Go Authors</button>     </Link>
      </div>


      {/* ── 11.2 KPI cards ──────────────────────────────────────────────── */}

      <h2>Summary</h2>

      <table>
        <tbody>
          <tr><td>Total books</td>      <td>{seedBooks.length}</td></tr>
          <tr><td>Total stock (units)</td> <td>{totalStock}</td></tr>
          <tr><td>Total orders</td>     <td>{seedOrders.length}</td></tr>
          <tr><td>Total manuscripts</td><td>{seedManuscripts.length}</td></tr>
          <tr><td>Total workers</td>    <td>{seedWorkers.length}</td></tr>
          <tr><td>Total sales</td>      <td>{seedSales}</td></tr>
          <tr><td>Total royalties</td>  <td>{seedRoyTotal}</td></tr>
          <tr><td>Total costs</td>      <td>{seedCosts}</td></tr>
          <tr><td>Profit estimate</td>  <td>{totalProfit}</td></tr>
        </tbody>
      </table>


      {/* ── 11.3 Stock alert ────────────────────────────────────────────── */}

      <h2>Low Stock</h2>

      {lowStockBooks.length === 0
        ? <div>All stock levels OK</div>
        : lowStockBooks.map(b => (
            <div key={b.id}>
              {b.code} — {b.title} — stock: {b.stock}
            </div>
          ))
      }


      {/* ── 11.4 Print alert ────────────────────────────────────────────── */}

      <h2>Ready for Print</h2>

      {printReady.length === 0
        ? <div>No manuscripts pending</div>
        : printReady.map(m => (
            <div key={m.id}>
              {m.title} — {m.author}
            </div>
          ))
      }


      {/* ── 11.5 Royalty alert ──────────────────────────────────────────── */}

      <h2>Unpaid Royalties</h2>

      {unpaidRoyalties.length === 0
        ? <div>All royalties settled</div>
        : unpaidRoyalties.map(r => (
            <div key={r.id}>
              {r.author} — {r.book} — {r.amount}
            </div>
          ))
      }


      {/* ── 11.6 HR alert ───────────────────────────────────────────────── */}

      <h2>HR Alerts</h2>

      {missingCnps.map(w => (
        <div key={w.id}>{w.name} — CNPS number missing</div>
      ))}

      {missingSalary.map(w => (
        <div key={w.id}>{w.name} — Salary not set</div>
      ))}

      {missingCnps.length === 0 && missingSalary.length === 0 && (
        <div>HR compliance OK</div>
      )}


      {/* ── 11.9 Report shortcuts ───────────────────────────────────────── */}

      <h2>Reports</h2>

      <div>
        <Link href="/accounting"><button>Sales Report</button></Link>
        <Link href="/royalties"> <button>Royalty Report</button></Link>
        <Link href="/printing">  <button>Print Report</button></Link>
        <Link href="/hr">        <button>HR Report</button></Link>
        <Link href="/accounting"><button>Profit Report</button></Link>
      </div>


    </div>

  )

}
