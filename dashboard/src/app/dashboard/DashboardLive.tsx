"use client"

import { useState, useEffect, useCallback } from "react"

interface Stats {
  orderCount:         number
  totalRevenue:       number
  activeWorkers:      number
  pendingInvoices:    number
  lowStockCount:      number
  printReadyCount:    number
  unpaidRoyaltyCount: number
  unreadNotifs:       number
  updatedAt:          string
}

function elapsed(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (secs < 5)  return "just now"
  if (secs < 60) return `${secs}s ago`
  return `${Math.floor(secs / 60)}m ago`
}

export default function DashboardLive({ name }: { name: string }) {
  const [stats,      setStats]      = useState<Stats | null>(null)
  const [lastTick,   setLastTick]   = useState("")
  const [countdown,  setCountdown]  = useState(60)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/stats")
      if (!res.ok) return
      const json: Stats = await res.json()
      setStats(json)
      setLastTick(json.updatedAt)
      setCountdown(60)
    } catch {
      // silently fail
    }
  }, [])

  // Auto-refresh every 60 seconds
  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 60_000)
    return () => clearInterval(interval)
  }, [fetchStats])

  // Countdown ticker
  useEffect(() => {
    const t = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000)
    return () => clearInterval(t)
  }, [])

  if (!stats) return null

  return (
    <div style={{ marginBottom: 24 }}>

      {/* Welcome banner */}
      <div style={{
        background:   "linear-gradient(135deg, #1a1a2e 0%, #1a73e8 100%)",
        borderRadius: 12,
        padding:      "20px 24px",
        marginBottom: 20,
        display:      "flex",
        justifyContent:"space-between",
        alignItems:   "center",
      }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>
            {greeting}, {name}.
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 4 }}>
            Here is your NMI Intelligence Overview.
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
            Last updated {lastTick ? elapsed(lastTick) : "—"}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
            Refreshes in {countdown}s
          </div>
        </div>
      </div>

      {/* Live KPI row */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {[
          { label: "Orders",          value: stats.orderCount,         color: "#1a73e8" },
          { label: "Revenue (XAF)",   value: stats.totalRevenue.toLocaleString(), color: "#16a34a" },
          { label: "Active Workers",  value: stats.activeWorkers,      color: "#7c3aed" },
          { label: "Pending Invoices",value: stats.pendingInvoices,    color: stats.pendingInvoices > 0 ? "#f97316" : "#1a73e8" },
          { label: "Low Stock",       value: stats.lowStockCount,      color: stats.lowStockCount > 0 ? "#ef4444" : "#6b7280" },
          { label: "Print Ready",     value: stats.printReadyCount,    color: stats.printReadyCount > 0 ? "#7c3aed" : "#6b7280" },
        ].map(k => (
          <div key={k.label} style={{
            background:   "#fff",
            border:       "1px solid #e2e8f0",
            borderRadius: 8,
            padding:      "14px 18px",
            minWidth:     140,
            flex:         "1 1 140px",
          }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: k.color, lineHeight: 1 }}>{k.value}</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>{k.label}</div>
          </div>
        ))}
      </div>

    </div>
  )
}
