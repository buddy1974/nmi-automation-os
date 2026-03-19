import type { AutomationJob }  from "@prisma/client"
import { prisma }              from "./db"
import { computeRating }       from "./performance-utils"

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

// ── Performance evaluation ────────────────────────────────────────────────────

// Bonus percent by rating
const BONUS_PERCENT: Record<string, number> = {
  "Outstanding":       0.25,
  "Excellent":         0.18,
  "Very Good":         0.12,
  "Good":              0.07,
  "Needs Improvement": 0.02,
  "Critical":          0,
}

// Salary increase percent by rating
const SALARY_INCREASE_PERCENT: Record<string, number> = {
  "Outstanding":       0.15,
  "Excellent":         0.10,
  "Very Good":         0.07,
  "Good":              0.03,
  "Needs Improvement": 0,
  "Critical":          0,
}

async function handlePerformanceEvaluation(payload: Record<string, unknown>): Promise<AIActionResult> {
  const recordId = Number(payload.recordId)
  if (!recordId) return { ok: false, error: "recordId required in payload" }

  const record = await prisma.performanceRecord.findUnique({
    where:   { id: recordId },
    include: { worker: true },
  })
  if (!record) return { ok: false, error: `PerformanceRecord ${recordId} not found` }

  const totalScore   = record.attendance + record.productivity + record.quality + record.teamwork + record.discipline
  const scorePercent = (totalScore / 500) * 100
  const { rating, bonus: bonusScore, recommendation } = computeRating(totalScore)
  const aiSummary    = `${record.worker.name} scored ${totalScore}/500 (${rating}). Recommendation: ${recommendation}`

  // Salary / bonus engine
  const baseSalary      = Number(record.worker.salaryBase) ?? 0
  const bonusPercent    = BONUS_PERCENT[rating]    ?? 0
  const increasePercent = SALARY_INCREASE_PERCENT[rating] ?? 0
  const bonusAmount     = Math.round(baseSalary * bonusPercent)
  const salaryIncrease  = Math.round(baseSalary * increasePercent)
  const suggestedSalary = baseSalary + salaryIncrease
  const aiBonusSummary  = `${record.worker.name} performance ${rating}. Bonus suggested: ${bonusAmount.toLocaleString()} XAF. New salary suggestion: ${suggestedSalary.toLocaleString()} XAF.`

  await prisma.performanceRecord.update({
    where: { id: recordId },
    data:  {
      totalScore, scorePercent, rating, bonusScore, recommendation, aiSummary,
      baseSalary, bonusPercent, bonusAmount, suggestedSalary, salaryIncrease, aiBonusSummary,
    },
  })

  return {
    ok: true, type: "performance_evaluation",
    summary: aiBonusSummary,
    data: { recordId, totalScore, scorePercent, rating, bonusScore, recommendation, baseSalary, bonusAmount, suggestedSalary, salaryIncrease },
  }
}

// ── Main dispatcher ───────────────────────────────────────────────────────────

export async function runAIAction(job: AutomationJob): Promise<AIActionResult> {
  const payload = (job.payload ?? {}) as Record<string, unknown>

  switch (job.type) {
    case "manuscript_review":       return handleManuscriptReview(payload)
    case "ai_invoice_summary":      return handleInvoiceSummaryAI(payload)
    case "stock_alert":             return handleStockAlert(payload)
    case "hr_onboarding":           return handleHROnboarding(payload)
    case "performance_evaluation":  return handlePerformanceEvaluation(payload)
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
  "performance_evaluation",
]
