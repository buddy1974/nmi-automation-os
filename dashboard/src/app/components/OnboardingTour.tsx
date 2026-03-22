"use client"

import { useState, useEffect } from "react"

const STEPS = [
  {
    title: "Welcome to NMI Automation OS",
    body:  "This is your central command centre for NMI Education — orders, finance, HR, publishing, and AI in one place.",
    icon:  "🏢",
  },
  {
    title: "CEO Morning Briefing",
    body:  "Every morning, the AI generates an executive summary of all business areas. Find it under Briefing in the sidebar.",
    icon:  "📋",
  },
  {
    title: "Automation Workflows",
    body:  "Connect n8n to trigger stock alerts, royalty checks, task reminders, and email routing — fully automated.",
    icon:  "⚡",
  },
  {
    title: "WhatsApp & Email AI",
    body:  "Incoming messages and emails are classified and replied to by Claude AI in French or English.",
    icon:  "🤖",
  },
  {
    title: "Knowledge Base",
    body:  "All NMI policies and SOPs are indexed and searchable. Ask the AI any question about your business.",
    icon:  "📚",
  },
]

const LS_KEY = "nmi_tour_done"

export default function OnboardingTour() {
  const [step,    setStep]    = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem(LS_KEY)) {
      setVisible(true)
    }
  }, [])

  function dismiss() {
    localStorage.setItem(LS_KEY, "1")
    setVisible(false)
  }

  function next() {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else dismiss()
  }

  if (!visible) return null

  const s = STEPS[step]

  return (
    <div style={{
      position:  "fixed",
      inset:     0,
      background:"rgba(0,0,0,0.6)",
      zIndex:    1000,
      display:   "flex",
      alignItems:"center",
      justifyContent:"center",
    }}>
      <div style={{
        background:   "#fff",
        borderRadius: 16,
        padding:      40,
        maxWidth:     480,
        width:        "90%",
        boxShadow:    "0 24px 64px rgba(0,0,0,0.3)",
        textAlign:    "center",
      }}>

        {/* Icon */}
        <div style={{ fontSize: 48, marginBottom: 16 }}>{s.icon}</div>

        {/* Title */}
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1a1a2e", margin: "0 0 12px" }}>
          {s.title}
        </h2>

        {/* Body */}
        <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6, margin: "0 0 28px" }}>
          {s.body}
        </p>

        {/* Progress dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 24 }}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width:        i === step ? 20 : 8,
                height:       8,
                borderRadius: 999,
                background:   i === step ? "#1a73e8" : "#e2e8f0",
                transition:   "width 0.2s ease, background 0.2s ease",
              }}
            />
          ))}
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button
            onClick={dismiss}
            style={{
              background:   "transparent",
              border:       "1px solid #e2e8f0",
              borderRadius: 8,
              padding:      "8px 20px",
              fontSize:     13,
              color:        "#9ca3af",
              cursor:       "pointer",
            }}
          >
            Skip tour
          </button>
          <button
            onClick={next}
            style={{
              background:   "#1a1a2e",
              border:       "none",
              borderRadius: 8,
              padding:      "8px 24px",
              fontSize:     13,
              fontWeight:   700,
              color:        "#fff",
              cursor:       "pointer",
            }}
          >
            {step < STEPS.length - 1 ? "Next →" : "Get started"}
          </button>
        </div>

      </div>
    </div>
  )
}
