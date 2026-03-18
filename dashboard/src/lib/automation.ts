import { prisma } from "./db"
import type { AutomationJob } from "@prisma/client"

// ── Job result type ───────────────────────────────────────────────────────────

export interface JobResult {
  ok:       boolean
  message?: string
  summary?: string
  data?:    unknown
  error?:   string
}

// ── Job handlers ──────────────────────────────────────────────────────────────

async function handlePing(): Promise<JobResult> {
  return { ok: true, message: "pong" }
}

async function handleInvoiceSummary(): Promise<JobResult> {
  const invoices = await prisma.invoice.findMany()
  const total    = invoices.reduce((s, i) => s + Number(i.amount), 0)
  const paid     = invoices.reduce((s, i) => s + Number(i.paid),   0)
  return {
    ok: true,
    summary: "invoice summary",
    data: {
      count:        invoices.length,
      totalRevenue: total,
      totalPaid:    paid,
      totalUnpaid:  total - paid,
      countPaid:    invoices.filter(i => i.status === "paid").length,
      countPartial: invoices.filter(i => i.status === "partial").length,
      countUnpaid:  invoices.filter(i => i.status === "issued").length,
    },
  }
}

async function handleStockCheck(): Promise<JobResult> {
  const products  = await prisma.product.findMany()
  const lowStock  = products.filter(p => p.stock <= 5)
  const zeroStock = products.filter(p => p.stock === 0)
  return {
    ok: true,
    summary: "stock check",
    data: {
      totalProducts:    products.length,
      lowStockCount:    lowStock.length,
      zeroStockCount:   zeroStock.length,
      lowStockTitles:   lowStock.map(p => p.code),
      zeroStockTitles:  zeroStock.map(p => p.code),
    },
  }
}

// ── Main runner ───────────────────────────────────────────────────────────────

export async function runJob(job: AutomationJob): Promise<JobResult> {
  switch (job.type) {
    case "ping":             return handlePing()
    case "invoice_summary":  return handleInvoiceSummary()
    case "stock_check":      return handleStockCheck()
    default:
      return { ok: false, error: `Unknown job type: "${job.type}"` }
  }
}
