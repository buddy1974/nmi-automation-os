import Link            from "next/link"
import { cookies }    from "next/headers"
import { redirect }   from "next/navigation"
import { prisma }     from "@/lib/db"
import { getSession } from "@/lib/auth"
import { resolveCompany } from "@/lib/companyFilter"
import WATable        from "./WATable"

export const dynamic = "force-dynamic"

import type { Metadata } from "next"
export const metadata: Metadata = { title: "WhatsApp — NMI Automation OS" }

const ALLOWED = ["owner", "admin"]

function detectLang(text: string): "French" | "English" | "Other" {
  const frWords = /\b(bonjour|merci|combien|coûte|livre|commande|veux|soumettre|comment|je|vous|nous|est|les|des|une|pour)\b/i
  const enWords = /\b(hello|hi|how|much|price|order|book|want|submit|become|distributor|please|thank|i|you|the|is|are|can)\b/i
  const frScore = (text.match(frWords) ?? []).length
  const enScore = (text.match(enWords) ?? []).length
  if (frScore > enScore) return "French"
  if (enScore > frScore) return "English"
  return "Other"
}

function statusBadge(status: string) {
  const map: Record<string, { bg: string; color: string }> = {
    received:  { bg: "#eff6ff", color: "#2563eb" },
    replied:   { bg: "#f0fdf4", color: "#16a34a" },
    escalated: { bg: "#fff7ed", color: "#ea580c" },
    handled:   { bg: "#f9fafb", color: "#6b7280" },
  }
  const s = map[status] ?? map.received
  return (
    <span style={{ background: s.bg, color: s.color, padding: "2px 9px", borderRadius: 10, fontSize: 11, fontWeight: 700 }}>
      {status}
    </span>
  )
}

export default async function WhatsAppPage() {
  const jar     = await cookies()
  const session = await getSession(jar.get("nmi_session")?.value)
  if (!session || !ALLOWED.includes(session.role)) redirect("/dashboard")
  const cid     = resolveCompany(session, jar.get("nmi_company")?.value)

  const msgs = await prisma.whatsAppMessage.findMany({
    where:   cid ? { companyId: cid } : {},
    orderBy: { createdAt: "desc" },
    take:    200,
  })

  const today     = new Date(); today.setHours(0, 0, 0, 0)
  const total     = msgs.length
  const unhandled = msgs.filter(m => !m.handled).length
  const todayCount = msgs.filter(m => new Date(m.createdAt) >= today).length
  const aiReplied  = msgs.filter(m => m.reply && m.status === "replied").length

  const serialized = msgs.map(m => ({
    ...m,
    lang:      detectLang(m.message),
    createdAt: m.createdAt.toISOString(),
  }))

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111", margin: 0 }}>WhatsApp Intelligence</h1>
          <p style={{ color: "#6b7280", marginTop: 6, fontSize: 14 }}>
            AI-powered customer support — auto-replies in French and English
          </p>
        </div>
        <Link
          href="/whatsapp/simulate"
          style={{ background: "#25d366", color: "#fff", padding: "10px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none" }}
        >
          ▶ Test Simulator
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
        {[
          { label: "Total Messages", value: total,      color: "#374151" },
          { label: "Unhandled",      value: unhandled,  color: unhandled > 0 ? "#d97706" : "#16a34a" },
          { label: "Today",          value: todayCount, color: "#2563eb" },
          { label: "AI Replied",     value: aiReplied,  color: "#16a34a" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "16px 20px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af" }}>{s.label.toUpperCase()}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {total === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af" }}>
          No messages yet.{" "}
          <Link href="/whatsapp/simulate" style={{ color: "#25d366" }}>Run the simulator →</Link>
        </div>
      ) : (
        <WATable messages={serialized} />
      )}
    </div>
  )
}
