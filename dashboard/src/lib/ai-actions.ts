import type { AutomationJob } from "@prisma/client"

// ── AI action result ──────────────────────────────────────────────────────────

export interface AIActionResult {
  ok:      boolean
  type?:   string
  summary?: string
  issues?: string[]
  data?:   unknown
  error?:  string
}

// ── Handlers ──────────────────────────────────────────────────────────────────

function handleManuscriptReview(payload: Record<string, unknown>): AIActionResult {
  const title = (payload.title as string) ?? "Untitled manuscript"
  return {
    ok:      true,
    type:    "manuscript_review",
    summary: `AI review of "${title}" — placeholder result`,
    issues:  ["grammar check", "level check", "subject match", "curriculum alignment"],
  }
}

function handleInvoiceSummaryAI(payload: Record<string, unknown>): AIActionResult {
  const customer = (payload.customer as string) ?? "unknown customer"
  return {
    ok:      true,
    type:    "invoice_summary",
    summary: `AI invoice summary for ${customer} — placeholder result`,
  }
}

function handleStockAlert(payload: Record<string, unknown>): AIActionResult {
  const threshold = (payload.threshold as number) ?? 5
  return {
    ok:      true,
    type:    "stock_alert",
    summary: `AI stock alert — products below ${threshold} units flagged`,
    data:    { threshold },
  }
}

function handleHROnboarding(payload: Record<string, unknown>): AIActionResult {
  const worker = (payload.worker as string) ?? "new worker"
  return {
    ok:      true,
    type:    "hr_onboarding",
    summary: `AI onboarding checklist for ${worker} — placeholder result`,
    issues:  [
      "Collect national ID",
      "Sign employment contract",
      "Register with CNPS",
      "Set up payroll",
      "Assign role in system",
    ],
  }
}

// ── Main dispatcher ───────────────────────────────────────────────────────────

export async function runAIAction(job: AutomationJob): Promise<AIActionResult> {
  const payload = (job.payload ?? {}) as Record<string, unknown>

  switch (job.type) {
    case "manuscript_review":  return handleManuscriptReview(payload)
    case "ai_invoice_summary": return handleInvoiceSummaryAI(payload)
    case "stock_alert":        return handleStockAlert(payload)
    case "hr_onboarding":      return handleHROnboarding(payload)
    default:
      return { ok: false, error: `Unknown AI action: "${job.type}"` }
  }
}

// ── Types handled by this module (used by automation.ts router) ───────────────

export const AI_JOB_TYPES = [
  "manuscript_review",
  "ai_invoice_summary",
  "stock_alert",
  "hr_onboarding",
]
