"use client"

import { useState } from "react"

export const dynamic = "force-dynamic"

// ── Book data ─────────────────────────────────────────────────────────────────

type Book = {
  code: string
  title: string
  level: string
  class: string
  subject: string
  isbn: string
  price: number
  category: "primary" | "secondary" | "literature" | "kids" | "guides"
  series?: string
}

const BOOKS: Book[] = [
  // ── Primary — Anglophone (Winners series) ────────────────────────────────────
  { code: "P-ENG-1",   title: "English, Class 1",                       level: "Primary", class: "Class 1",   subject: "English",                  isbn: "978-9956-0-1190-2", price: 2500, category: "primary", series: "Winners" },
  { code: "P-ENG-2",   title: "English, Class 2",                       level: "Primary", class: "Class 2",   subject: "English",                  isbn: "978-9956-0-1191-9", price: 2500, category: "primary", series: "Winners" },
  { code: "P-ENG-3",   title: "English, Class 3",                       level: "Primary", class: "Class 3",   subject: "English",                  isbn: "978-9956-0-1192-6", price: 2500, category: "primary", series: "Winners" },
  { code: "P-ENG-4",   title: "English, Class 4",                       level: "Primary", class: "Class 4",   subject: "English",                  isbn: "978-9956-0-1193-3", price: 2500, category: "primary", series: "Winners" },
  { code: "P-ENG-5",   title: "English, Class 5",                       level: "Primary", class: "Class 5",   subject: "English",                  isbn: "978-9956-0-1194-0", price: 2500, category: "primary", series: "Winners" },
  { code: "P-ENG-6",   title: "English, Class 6",                       level: "Primary", class: "Class 6",   subject: "English",                  isbn: "978-9956-0-1195-7", price: 2500, category: "primary", series: "Winners" },
  { code: "P-FR-1",    title: "French, Class 1",                        level: "Primary", class: "Class 1",   subject: "French",                   isbn: "978-9956-0-1196-4", price: 2500, category: "primary", series: "Winners" },
  { code: "P-FR-2",    title: "French, Class 2",                        level: "Primary", class: "Class 2",   subject: "French",                   isbn: "978-9956-0-1197-1", price: 2500, category: "primary", series: "Winners" },
  { code: "P-FR-3",    title: "French, Class 3",                        level: "Primary", class: "Class 3",   subject: "French",                   isbn: "978-9956-0-1198-8", price: 2500, category: "primary", series: "Winners" },
  { code: "P-FR-4",    title: "French, Class 4",                        level: "Primary", class: "Class 4",   subject: "French",                   isbn: "978-9956-0-1199-5", price: 2500, category: "primary", series: "Winners" },
  { code: "P-FR-5",    title: "French, Class 5",                        level: "Primary", class: "Class 5",   subject: "French",                   isbn: "978-9956-0-1200-8", price: 2500, category: "primary", series: "Winners" },
  { code: "P-FR-6",    title: "French, Class 6",                        level: "Primary", class: "Class 6",   subject: "French",                   isbn: "978-9956-0-1201-5", price: 2500, category: "primary", series: "Winners" },
  { code: "P-MATH-1",  title: "Mathematics, Class 1",                   level: "Primary", class: "Class 1",   subject: "Mathematics",              isbn: "978-9956-0-1202-2", price: 2500, category: "primary", series: "Winners" },
  { code: "P-MATH-2",  title: "Mathematics, Class 2",                   level: "Primary", class: "Class 2",   subject: "Mathematics",              isbn: "978-9956-0-1203-9", price: 2500, category: "primary", series: "Winners" },
  { code: "P-MATH-3",  title: "Mathematics, Class 3",                   level: "Primary", class: "Class 3",   subject: "Mathematics",              isbn: "978-9956-0-1208-4", price: 2500, category: "primary", series: "Winners" },
  { code: "P-MATH-4",  title: "Mathematics, Class 4",                   level: "Primary", class: "Class 4",   subject: "Mathematics",              isbn: "978-9956-0-1209-1", price: 2500, category: "primary", series: "Winners" },
  { code: "P-MATH-5",  title: "Mathematics, Class 5",                   level: "Primary", class: "Class 5",   subject: "Mathematics",              isbn: "978-9956-0-1210-7", price: 2500, category: "primary", series: "Winners" },
  { code: "P-MATH-6",  title: "Mathematics, Class 6",                   level: "Primary", class: "Class 6",   subject: "Mathematics",              isbn: "978-9956-0-1211-4", price: 2500, category: "primary", series: "Winners" },
  { code: "P-SCI-1",   title: "Sciences & Technology, Class 1",         level: "Primary", class: "Class 1",   subject: "Science",                  isbn: "978-9956-0-1212-1", price: 2500, category: "primary", series: "Winners" },
  { code: "P-SCI-2",   title: "Sciences & Technology, Class 2",         level: "Primary", class: "Class 2",   subject: "Science",                  isbn: "978-9956-0-1213-8", price: 2500, category: "primary", series: "Winners" },
  { code: "P-SCI-3",   title: "Sciences & Technology, Class 3",         level: "Primary", class: "Class 3",   subject: "Science",                  isbn: "978-9956-0-1214-5", price: 2500, category: "primary", series: "Winners" },
  { code: "P-SCI-4",   title: "Sciences & Technology, Class 4",         level: "Primary", class: "Class 4",   subject: "Science",                  isbn: "978-9956-0-1215-2", price: 2500, category: "primary", series: "Winners" },
  { code: "P-SCI-5",   title: "Sciences & Technology, Class 5",         level: "Primary", class: "Class 5",   subject: "Science",                  isbn: "978-9956-0-1216-9", price: 2500, category: "primary", series: "Winners" },
  { code: "P-SCI-6",   title: "Sciences & Technology, Class 6",         level: "Primary", class: "Class 6",   subject: "Science",                  isbn: "978-9956-0-1217-6", price: 2500, category: "primary", series: "Winners" },
  { code: "P-SOC-1-2", title: "Social Studies, Classes 1 & 2",          level: "Primary", class: "Class 1-2", subject: "Social Studies",           isbn: "978-9956-0-1218-3", price: 2500, category: "primary", series: "Winners" },
  { code: "P-SOC-3",   title: "Social Studies, Class 3",                level: "Primary", class: "Class 3",   subject: "Social Studies",           isbn: "978-9956-0-1219-0", price: 2500, category: "primary", series: "Winners" },
  { code: "P-SOC-4",   title: "Social Studies, Class 4",                level: "Primary", class: "Class 4",   subject: "Social Studies",           isbn: "978-9956-0-1220-6", price: 2500, category: "primary", series: "Winners" },
  { code: "P-SOC-5",   title: "Social Studies, Class 5",                level: "Primary", class: "Class 5",   subject: "Social Studies",           isbn: "978-9956-0-1221-3", price: 2500, category: "primary", series: "Winners" },
  { code: "P-SOC-6",   title: "Social Studies, Class 6",                level: "Primary", class: "Class 6",   subject: "Social Studies",           isbn: "978-9956-0-1222-0", price: 2500, category: "primary", series: "Winners" },
  { code: "P-ICT-1-2", title: "ICT, Level 1 (Classes 1 & 2)",           level: "Primary", class: "Class 1-2", subject: "ICT",                      isbn: "978-9956-0-1223-7", price: 2500, category: "primary", series: "Winners" },
  { code: "P-ICT-3-4", title: "ICT, Level 2 (Classes 3 & 4)",           level: "Primary", class: "Class 3-4", subject: "ICT",                      isbn: "978-9956-0-1224-4", price: 2500, category: "primary", series: "Winners" },
  { code: "P-ICT-5-6", title: "ICT, Level 3 (Classes 5 & 6)",           level: "Primary", class: "Class 5-6", subject: "ICT",                      isbn: "978-9956-0-1225-1", price: 2500, category: "primary", series: "Winners" },
  { code: "P-HW-1",    title: "Handwriting, Class 1",                   level: "Primary", class: "Class 1",   subject: "Handwriting",              isbn: "978-9956-0-1226-8", price: 2500, category: "primary", series: "Winners" },
  { code: "P-HW-2",    title: "Handwriting, Class 2",                   level: "Primary", class: "Class 2",   subject: "Handwriting",              isbn: "978-9956-0-1227-5", price: 2500, category: "primary", series: "Winners" },
  // ── Secondary — 1st Cycle (Prime series) ─────────────────────────────────────
  { code: "S-ENG-1",   title: "Prime English — Form 1",                 level: "Secondary", class: "Form 1", subject: "English",                   isbn: "978-9956-0-1228-2", price: 3500, category: "secondary", series: "Prime" },
  { code: "S-ENG-2",   title: "Prime English — Form 2",                 level: "Secondary", class: "Form 2", subject: "English",                   isbn: "978-9956-0-1229-9", price: 3500, category: "secondary", series: "Prime" },
  { code: "S-ENG-3",   title: "Prime English — Form 3",                 level: "Secondary", class: "Form 3", subject: "English",                   isbn: "978-9956-0-1230-5", price: 3500, category: "secondary", series: "Prime" },
  { code: "S-ENG-4",   title: "Prime English — Form 4",                 level: "Secondary", class: "Form 4", subject: "English",                   isbn: "978-9956-0-1231-2", price: 3500, category: "secondary", series: "Prime" },
  { code: "S-FR-1",    title: "Prime in French — Form 1",               level: "Secondary", class: "Form 1", subject: "French",                    isbn: "978-9956-0-1232-9", price: 3500, category: "secondary", series: "Prime" },
  { code: "S-FR-2",    title: "Prime in French — Form 2",               level: "Secondary", class: "Form 2", subject: "French",                    isbn: "978-9956-0-1233-6", price: 3500, category: "secondary", series: "Prime" },
  { code: "S-BIO-1",   title: "PRIME Biology Learner's Book 1",         level: "Secondary", class: "Form 1", subject: "Biology",                   isbn: "978-9956-0-1234-3", price: 3500, category: "secondary", series: "Prime" },
  { code: "S-BIO-45",  title: "PRIME Biology Learner's Book 4 & 5",     level: "Secondary", class: "Form 4-5", subject: "Biology",                 isbn: "978-9956-0-1235-0", price: 4500, category: "secondary", series: "Prime" },
  { code: "S-CHEM-1",  title: "PRIME Chemistry Learner's Book 1",       level: "Secondary", class: "Form 1", subject: "Chemistry",                 isbn: "978-9956-0-1236-7", price: 3500, category: "secondary", series: "Prime" },
  { code: "S-CHEM-45", title: "PRIME Chemistry Learner's Book 4 & 5",   level: "Secondary", class: "Form 4-5", subject: "Chemistry",               isbn: "978-9956-0-1237-4", price: 4500, category: "secondary", series: "Prime" },
  { code: "S-CS-1",    title: "PRIME Computer Science Book 1",          level: "Secondary", class: "Form 1", subject: "Computer Science",          isbn: "978-9956-0-1238-1", price: 3500, category: "secondary", series: "Prime" },
  { code: "S-CS-45",   title: "PRIME Computer Science Book 4 & 5",      level: "Secondary", class: "Form 4-5", subject: "Computer Science",        isbn: "978-9956-0-1239-8", price: 4500, category: "secondary", series: "Prime" },
  // ── Literature ────────────────────────────────────────────────────────────────
  { code: "L-FP",      title: "Foundation Pillars",                     level: "",          class: "",       subject: "General Literature",        isbn: "978-9956-501-514", price: 5000, category: "literature" },
  { code: "L-AQC",     title: "A Questionnable Culture?",               level: "",          class: "",       subject: "General Literature",        isbn: "978-9956-501-492", price: 2000, category: "literature" },
  { code: "L-AP1",     title: "Authentic Poetry — Book 1",              level: "",          class: "",       subject: "Poetry",                    isbn: "978-9956-502-960", price: 3500, category: "literature" },
  { code: "L-AP2",     title: "Authentic Poetry — Book 2",              level: "",          class: "",       subject: "Poetry",                    isbn: "",                  price: 3500, category: "literature" },
  { code: "L-AP3",     title: "Authentic Poetry — Book 3",              level: "",          class: "",       subject: "Poetry",                    isbn: "",                  price: 3500, category: "literature" },
  { code: "L-SF",      title: "Septembre Fou",                          level: "",          class: "",       subject: "Novel",                     isbn: "978-9956-0-1249-7", price: 3500, category: "literature" },
  { code: "L-RB",      title: "Royaume Bantou",                         level: "",          class: "",       subject: "Novel",                     isbn: "978-9956-0-1252-7", price: 4000, category: "literature" },
  { code: "L-MG",      title: "Mi-Grands",                              level: "",          class: "",       subject: "Novel",                     isbn: "978-9956-0-1251-0", price: 3500, category: "literature" },
  { code: "L-IP",      title: "L'ivresse du pardon",                    level: "",          class: "",       subject: "Novel",                     isbn: "978-9956-0-1255-8", price: 6000, category: "literature" },
  { code: "L-PB",      title: "Le prix de la bêtise",                   level: "",          class: "",       subject: "Novel",                     isbn: "978-9956-0-1253-4", price: 5000, category: "literature" },
  // ── Kids ─────────────────────────────────────────────────────────────────────
  { code: "K-TC",      title: "Tous citoyens",                          level: "Kids",      class: "",       subject: "Citizenship",               isbn: "",                  price: 3500, category: "kids" },
  { code: "K-PP",      title: "The Peace Plant",                        level: "Kids",      class: "",       subject: "Children's Fiction",        isbn: "",                  price: 3500, category: "kids" },
  { code: "K-HR",      title: "The Holy Robber",                        level: "Kids",      class: "",       subject: "Children's Fiction",        isbn: "",                  price: 3500, category: "kids" },
  { code: "K-ZT",      title: "Zuza, the Tortoise Who Changed the Odds",level: "Kids",      class: "",       subject: "Folktale",                  isbn: "",                  price: 4000, category: "kids" },
  { code: "K-PH",      title: "The Philanthropist",                     level: "Kids",      class: "",       subject: "Children's Fiction",        isbn: "",                  price: 3500, category: "kids" },
  { code: "K-ZPN",     title: "Ze la panthère et Ntomba le mouton",     level: "Kids",      class: "",       subject: "Folktale",                  isbn: "",                  price: 2500, category: "kids" },
  { code: "K-EM",      title: "L'École des modèles",                    level: "Kids",      class: "",       subject: "Children's Fiction",        isbn: "",                  price: 2500, category: "kids" },
  { code: "K-SW",      title: "Stories and Wonders",                    level: "Kids",      class: "",       subject: "Short Stories",             isbn: "",                  price: 2500, category: "kids" },
  // ── Guides ────────────────────────────────────────────────────────────────────
  { code: "G-PE",      title: "Prime English Teacher's Guide",          level: "Secondary", class: "",       subject: "Teacher's Guide",           isbn: "",                  price: 0,    category: "guides" },
  { code: "G-PCT",     title: "Guide PCT 4ème",                         level: "Secondary", class: "4ème",  subject: "Teacher's Guide",           isbn: "",                  price: 0,    category: "guides" },
]

// ── Style helpers ─────────────────────────────────────────────────────────────

const SUBJECT_COLOR: Record<string, string> = {
  English:           "#2563eb",
  French:            "#16a34a",
  Mathematics:       "#f97316",
  Science:           "#7c3aed",
  "Social Studies":  "#0891b2",
  ICT:               "#0e7490",
  Handwriting:       "#64748b",
  Biology:           "#15803d",
  Chemistry:         "#b45309",
  Physics:           "#6d28d9",
  "Computer Science":"#1d4ed8",
  Poetry:            "#9333ea",
  Novel:             "#c026d3",
  "General Literature":"#db2777",
  "Children's Fiction":"#ea580c",
  Folktale:          "#ca8a04",
  "Short Stories":   "#0284c7",
  Citizenship:       "#0f766e",
  "Teacher's Guide": "#475569",
}

const TAB_LABELS: { key: string; label: string }[] = [
  { key: "all",        label: "All" },
  { key: "primary",    label: "Primary" },
  { key: "secondary",  label: "Secondary" },
  { key: "literature", label: "Literature" },
  { key: "kids",       label: "Kids" },
  { key: "guides",     label: "Guides" },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function CataloguePage() {
  const [activeTab, setActiveTab] = useState<string>("all")
  const [cart, setCart] = useState<string[]>([])

  const filtered = activeTab === "all" ? BOOKS : BOOKS.filter(b => b.category === activeTab)

  const totals = TAB_LABELS.reduce<Record<string, number>>((acc, t) => {
    acc[t.key] = t.key === "all" ? BOOKS.length : BOOKS.filter(b => b.category === t.key).length
    return acc
  }, {})

  function addToCart(code: string) {
    setCart(prev => prev.includes(code) ? prev : [...prev, code])
  }

  const color = (subject: string) => SUBJECT_COLOR[subject] ?? "#475569"

  return (
    <div style={{ padding: "32px", background: "#f4f6f9", minHeight: "100vh", fontFamily: "Arial, sans-serif", color: "#1e293b" }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#1a1a2e", margin: "0 0 4px" }}>Book Catalogue</h1>
        <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
          {BOOKS.length} titles across Primary, Secondary, Literature, Kids &amp; Guides
          {cart.length > 0 && (
            <span style={{ marginLeft: "16px", background: "#2563eb", color: "#fff", borderRadius: "999px", padding: "2px 10px", fontSize: "12px", fontWeight: 600 }}>
              {cart.length} in cart
            </span>
          )}
        </p>
      </div>

      {/* ── Filter tabs ────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "28px" }}>
        {TAB_LABELS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              padding: "8px 16px",
              borderRadius: "999px",
              border: "none",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 600,
              background: activeTab === t.key ? "#1a1a2e" : "#fff",
              color:      activeTab === t.key ? "#fff"     : "#475569",
              boxShadow:  activeTab === t.key ? "none"     : "0 1px 3px rgba(0,0,0,0.08)",
              transition: "all 0.15s",
            }}
          >
            {t.label} <span style={{ opacity: 0.7, fontWeight: 400 }}>({totals[t.key]})</span>
          </button>
        ))}
      </div>

      {/* ── Book grid ──────────────────────────────────────────────────────── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: "20px",
      }}>
        {filtered.map(book => {
          const inCart  = cart.includes(book.code)
          const bg      = color(book.subject)

          return (
            <div
              key={book.code}
              style={{
                background: "#fff",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {/* Cover */}
              <div style={{
                height: "140px",
                borderRadius: "8px",
                background: bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                color: "#fff",
                fontWeight: 700,
                textAlign: "center",
                padding: "12px",
                lineHeight: 1.4,
              }}>
                {book.series ? (
                  <div>
                    <div style={{ fontSize: "13px", marginBottom: "6px", opacity: 0.85 }}>{book.series}</div>
                    <div style={{ fontSize: "11px" }}>{book.subject}</div>
                    <div style={{ fontSize: "10px", opacity: 0.75, marginTop: "4px" }}>{book.class}</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: "11px", opacity: 0.85 }}>{book.subject}</div>
                    {book.class && <div style={{ fontSize: "10px", opacity: 0.75, marginTop: "4px" }}>{book.class}</div>}
                  </div>
                )}
              </div>

              {/* Title */}
              <div style={{ fontWeight: 600, fontSize: "14px", lineHeight: 1.3, color: "#1e293b" }}>{book.title}</div>

              {/* Meta row */}
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                {book.level && (
                  <span style={{ fontSize: "11px", background: "#f1f5f9", color: "#475569", borderRadius: "4px", padding: "2px 6px" }}>
                    {book.level}
                  </span>
                )}
                <span style={{ fontSize: "11px", background: `${bg}18`, color: bg, borderRadius: "4px", padding: "2px 6px", fontWeight: 600 }}>
                  {book.subject}
                </span>
              </div>

              {/* ISBN */}
              {book.isbn && (
                <div style={{ fontSize: "11px", color: "#94a3b8", fontFamily: "monospace" }}>
                  ISBN {book.isbn}
                </div>
              )}

              {/* Price + Cart */}
              <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "8px" }}>
                <span style={{
                  background: book.price > 0 ? "#dcfce7" : "#f1f5f9",
                  color:      book.price > 0 ? "#166534" : "#64748b",
                  borderRadius: "999px",
                  padding: "3px 10px",
                  fontSize: "12px",
                  fontWeight: 700,
                }}>
                  {book.price > 0 ? `${book.price.toLocaleString()} XAF` : "Contact us"}
                </span>

                <button
                  onClick={() => addToCart(book.code)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: 600,
                    background: inCart ? "#dcfce7" : "#1a1a2e",
                    color:      inCart ? "#166534" : "#fff",
                    transition: "all 0.15s",
                  }}
                >
                  {inCart ? "✓ Added" : "+ Cart"}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
