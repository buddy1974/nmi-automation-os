import { NextResponse }   from "next/server"
import { prisma }         from "@/lib/db"
import { requireAuth }    from "@/lib/api-auth"
import { checkRateLimit } from "@/lib/rateLimit"
import Anthropic          from "@anthropic-ai/sdk"

export const runtime = "nodejs"

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// ── Scoring engine ────────────────────────────────────────────────────────────
// Scrum values  (30%): commitment, courage, focus, openness, respect  — each 0-10
// Task perf     (50%): taskCompletion, deadlineScore, qualityScore    — each 0-10
// Behavioral    (20%): penalty deductions via latenessCount, sickDaysCount, avgTaskHours

function calcScore(data: {
  commitment: number; courage: number; focus: number; openness: number; respect: number
  taskCompletion: number; deadlineScore: number; qualityScore: number
  latenessCount: number; sickDaysCount: number; avgTaskHours: number
}): { totalScore: number; scrumScore: number; taskScore: number; behavioralPenalty: number } {
  const scrumRaw  = (data.commitment + data.courage + data.focus + data.openness + data.respect) / 5
  const taskRaw   = (data.taskCompletion + data.deadlineScore + data.qualityScore) / 3

  const scrumScore = scrumRaw * 10  // → 0-100
  const taskScore  = taskRaw  * 10  // → 0-100

  // Behavioral penalty: each lateness -2, each sick day beyond 3 -1.5, avg task hours > 10 → -5
  const latenessPenalty  = Math.min(data.latenessCount * 2, 20)
  const sickPenalty      = Math.max(data.sickDaysCount - 3, 0) * 1.5
  const overworkPenalty  = data.avgTaskHours > 10 ? 5 : 0
  const behavioralPenalty = Math.min(latenessPenalty + sickPenalty + overworkPenalty, 20)

  const weighted = scrumScore * 0.30 + taskScore * 0.50
  const totalScore = Math.max(0, Math.min(100, weighted * (100 / 80) - behavioralPenalty))

  return { totalScore, scrumScore, taskScore, behavioralPenalty }
}

function deriveRating(score: number): string {
  if (score >= 90) return "Exceptional"
  if (score >= 75) return "Strong"
  if (score >= 60) return "Satisfactory"
  if (score >= 45) return "Needs Improvement"
  return "Underperforming"
}

// ── POST /api/hr/evaluate ─────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || "unknown"
    if (!checkRateLimit(ip, "default")) {
      return NextResponse.json({ error: "Rate limit exceeded", code: "RATE_LIMIT" }, { status: 429 })
    }

    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    if (!["admin", "owner", "manager"].includes(auth.role)) {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 })
    }

    const data = await req.json()

    const required = ["workerId", "workerName", "period"]
    for (const f of required) {
      if (!data[f]) return NextResponse.json({ error: `${f} is required`, code: "VALIDATION" }, { status: 400 })
    }

    const numFields = [
      "commitment", "courage", "focus", "openness", "respect",
      "taskCompletion", "deadlineScore", "qualityScore",
    ]
    for (const f of numFields) {
      const v = Number(data[f] ?? 0)
      if (v < 0 || v > 10) {
        return NextResponse.json({ error: `${f} must be 0–10`, code: "VALIDATION" }, { status: 400 })
      }
    }

    const input = {
      commitment:     Number(data.commitment     ?? 0),
      courage:        Number(data.courage        ?? 0),
      focus:          Number(data.focus          ?? 0),
      openness:       Number(data.openness       ?? 0),
      respect:        Number(data.respect        ?? 0),
      taskCompletion: Number(data.taskCompletion ?? 0),
      deadlineScore:  Number(data.deadlineScore  ?? 0),
      qualityScore:   Number(data.qualityScore   ?? 0),
      latenessCount:  Number(data.latenessCount  ?? 0),
      sickDaysCount:  Number(data.sickDaysCount  ?? 0),
      avgTaskHours:   Number(data.avgTaskHours   ?? 0),
    }

    const { totalScore, scrumScore, taskScore, behavioralPenalty } = calcScore(input)
    const rating = deriveRating(totalScore)

    // ── Claude AI summary ─────────────────────────────────────────────────────
    let aiSummary        = ""
    let aiRecommendation = ""
    let aiRating         = rating

    try {
      const prompt = `
You are an HR performance evaluator. Analyse this employee evaluation and provide a concise professional summary.

Employee: ${data.workerName}
Period: ${data.period}
Type: ${data.type ?? "quarterly"}

Scoring breakdown:
- Scrum Values (commitment, courage, focus, openness, respect): ${scrumScore.toFixed(1)}/100
- Task Performance (completion, deadlines, quality): ${taskScore.toFixed(1)}/100
- Behavioral Penalty: -${behavioralPenalty.toFixed(1)} points
- TOTAL SCORE: ${totalScore.toFixed(1)}/100
- Rating: ${rating}

Raw inputs:
  Commitment: ${input.commitment}/10, Courage: ${input.courage}/10, Focus: ${input.focus}/10
  Openness: ${input.openness}/10, Respect: ${input.respect}/10
  Task Completion: ${input.taskCompletion}/10, Deadline Score: ${input.deadlineScore}/10, Quality: ${input.qualityScore}/10
  Lateness incidents: ${input.latenessCount}, Sick days: ${input.sickDaysCount}, Avg task hours: ${input.avgTaskHours}h

Respond in JSON with exactly two keys:
{
  "summary": "2-3 sentence performance summary",
  "recommendation": "1-2 sentence actionable recommendation for the employee"
}`

      const msg = await ai.messages.create({
        model:      "claude-sonnet-4-6",
        max_tokens: 400,
        messages:   [{ role: "user", content: prompt }],
      })

      const text = (msg.content[0] as { type: string; text: string }).text.trim()
      const jsonStart = text.indexOf("{")
      const jsonEnd   = text.lastIndexOf("}") + 1
      if (jsonStart !== -1) {
        const parsed = JSON.parse(text.slice(jsonStart, jsonEnd))
        aiSummary        = parsed.summary        ?? ""
        aiRecommendation = parsed.recommendation ?? ""
        aiRating         = rating
      }
    } catch {
      // AI failure is non-fatal
    }

    // ── Persist ───────────────────────────────────────────────────────────────
    const session = await prisma.evaluationSession.create({
      data: {
        workerId:         data.workerId,
        workerName:       data.workerName,
        evaluatorId:      auth.id,
        period:           data.period,
        type:             data.type ?? "quarterly",
        commitment:       input.commitment,
        courage:          input.courage,
        focus:            input.focus,
        openness:         input.openness,
        respect:          input.respect,
        taskCompletion:   input.taskCompletion,
        deadlineScore:    input.deadlineScore,
        qualityScore:     input.qualityScore,
        latenessCount:    input.latenessCount,
        sickDaysCount:    input.sickDaysCount,
        avgTaskHours:     input.avgTaskHours,
        aiRating,
        aiSummary,
        aiRecommendation,
        totalScore,
        rating,
        companyId:        auth.companyId ?? null,
      },
    })

    return NextResponse.json({ session, scrumScore, taskScore, behavioralPenalty }, { status: 201 })

  } catch (err) {
    console.error("[POST /api/hr/evaluate]", err)
    return NextResponse.json({ error: "Internal server error", code: "SERVER_ERROR" }, { status: 500 })
  }
}
