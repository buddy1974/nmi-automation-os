"use client"

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        background:   "#1a1a2e",
        color:        "#fff",
        border:       "none",
        borderRadius: 8,
        padding:      "8px 18px",
        fontSize:     13,
        fontWeight:   700,
        cursor:       "pointer",
      }}
    >
      ⎙ Print Report
    </button>
  )
}
