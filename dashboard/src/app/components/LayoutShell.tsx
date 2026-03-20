"use client"

import { useState } from "react"
import styles from "./LayoutShell.module.css"

export default function LayoutShell({
  sidebar,
  header,
  children,
}: {
  sidebar:  React.ReactNode
  header:   React.ReactNode
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className={styles.shell}>

      {/* Mobile overlay backdrop */}
      {open && (
        <div
          className={styles.backdrop}
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div className={`${styles.sidebarWrap} ${open ? styles.sidebarOpen : ""}`}>
        {sidebar}
      </div>

      {/* Main area */}
      <div className={styles.main}>

        {/* Top bar: hamburger + header */}
        <div className={styles.topBar}>
          <button
            className={styles.hamburger}
            onClick={() => setOpen(o => !o)}
            aria-label="Toggle menu"
          >
            ☰
          </button>
          <div className={styles.headerWrap}>{header}</div>
        </div>

        {/* Page content */}
        <main className={styles.content}>
          {children}
        </main>

      </div>
    </div>
  )
}
