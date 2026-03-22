import Link            from "next/link"
import { cookies }    from "next/headers"
import { redirect }   from "next/navigation"
import { prisma }     from "@/lib/db"
import { getSession } from "@/lib/auth"
import { resolveCompany } from "@/lib/companyFilter"

export const dynamic = "force-dynamic"

const ALLOWED = ["owner", "admin"]

const CATEGORIES = ["All", "HR", "Finance", "Editorial", "Sales", "Distribution", "Printing", "Legal"]

const CAT_COLORS: Record<string, { bg: string; color: string }> = {
  HR:           { bg: "#fdf4ff", color: "#9333ea" },
  Finance:      { bg: "#fffbeb", color: "#d97706" },
  Editorial:    { bg: "#eff6ff", color: "#1a73e8" },
  Sales:        { bg: "#f0fdf4", color: "#16a34a" },
  Distribution: { bg: "#f0f9ff", color: "#0284c7" },
  Printing:     { bg: "#fff7ed", color: "#ea580c" },
  Legal:        { bg: "#fef2f2", color: "#dc2626" },
}

function catBadge(cat: string) {
  const s = CAT_COLORS[cat] ?? { bg: "#f3f4f6", color: "#6b7280" }
  return (
    <span style={{ background: s.bg, color: s.color, padding: "2px 9px", borderRadius: 10, fontSize: 11, fontWeight: 700 }}>
      {cat}
    </span>
  )
}

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const sp       = await searchParams
  const jar      = await cookies()
  const session  = await getSession(jar.get("nmi_session")?.value)
  if (!session || !ALLOWED.includes(session.role)) redirect("/dashboard")
  const cid      = resolveCompany(session, jar.get("nmi_company")?.value)
  const isPriv   = session.role === "admin" || session.role === "owner"

  const where: Record<string, unknown> = { active: true }
  if (!isPriv && cid) where.companyId = cid
  if (sp.category && sp.category !== "All") where.category = sp.category

  const docs = await prisma.knowledgeDoc.findMany({
    where,
    select: { id: true, title: true, category: true, tags: true, source: true, createdAt: true, createdBy: true },
    orderBy: { createdAt: "desc" },
  })

  const allDocs    = await prisma.knowledgeDoc.findMany({ where: { active: true }, select: { category: true } })
  const catCounts  = allDocs.reduce<Record<string, number>>((a, d) => { a[d.category] = (a[d.category] ?? 0) + 1; return a }, {})
  const activeCat  = sp.category ?? "All"

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111", margin: 0 }}>Knowledge Base</h1>
          <p style={{ color: "#6b7280", marginTop: 6, fontSize: 14 }}>
            Company policies, SOPs, and guidelines — ask questions with AI
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link
            href="/knowledge/ask"
            style={{ background: "#1a73e8", color: "#fff", padding: "10px 18px", borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none" }}
          >
            ✦ Ask AI
          </Link>
          {["admin", "owner", "manager"].includes(session?.role ?? "") && (
            <Link
              href="/knowledge/new"
              style={{ background: "#1a1a2e", color: "#fff", padding: "10px 18px", borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none" }}
            >
              + Add Document
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Docs",  value: allDocs.length,               color: "#374151" },
          { label: "Categories",  value: Object.keys(catCounts).length, color: "#1a73e8" },
          { label: "This View",   value: docs.length,                   color: "#374151" },
          { label: "Last Added",  value: docs[0] ? docs[0].createdAt.toISOString().slice(0, 10) : "—", color: "#6b7280" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "14px 18px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af" }}>{s.label.toUpperCase()}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Category tabs */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {CATEGORIES.map(cat => {
          const count = cat === "All" ? allDocs.length : (catCounts[cat] ?? 0)
          const isActive = activeCat === cat
          return (
            <Link
              key={cat}
              href={cat === "All" ? "/knowledge" : `/knowledge?category=${cat}`}
              style={{
                padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                textDecoration: "none",
                background: isActive ? "#1a1a2e" : "#f3f4f6",
                color:      isActive ? "#fff"    : "#374151",
              }}
            >
              {cat} <span style={{ opacity: 0.6, fontSize: 11 }}>({count})</span>
            </Link>
          )
        })}
      </div>

      {/* Docs table */}
      {docs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af" }}>
          No documents in this category.
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                {["Title", "Category", "Tags", "Source", "Added", ""].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {docs.map((doc, i) => (
                <tr key={doc.id} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "12px 14px", fontWeight: 600, fontSize: 14, maxWidth: 280 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.title}</div>
                  </td>
                  <td style={{ padding: "12px 14px" }}>{catBadge(doc.category)}</td>
                  <td style={{ padding: "12px 14px", fontSize: 12, color: "#6b7280", maxWidth: 200 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.tags ?? "—"}</div>
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: 12, color: "#9ca3af" }}>{doc.source ?? "—"}</td>
                  <td style={{ padding: "12px 14px", fontSize: 12, color: "#9ca3af", whiteSpace: "nowrap" }}>
                    {doc.createdAt.toISOString().slice(0, 10)}
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <Link
                      href={`/knowledge/ask?q=${encodeURIComponent(doc.title)}`}
                      style={{ fontSize: 12, color: "#1a73e8", textDecoration: "none", fontWeight: 600 }}
                    >
                      Ask →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
