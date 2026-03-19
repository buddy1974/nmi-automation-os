"use server"

import { prisma }                       from "@/lib/db"
import { revalidatePath }               from "next/cache"
import { computeRating, MAX_SCORE }     from "@/lib/performance-utils"

export async function createPerformanceRecord(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {

  const workerId     = Number(formData.get("workerId"))
  const period       = (formData.get("period")      as string)?.trim()
  const attendance   = Number(formData.get("attendance"))
  const productivity = Number(formData.get("productivity"))
  const quality      = Number(formData.get("quality"))
  const teamwork     = Number(formData.get("teamwork"))
  const discipline   = Number(formData.get("discipline"))
  const managerNote  = (formData.get("managerNote") as string)?.trim() || null

  if (!workerId || !period) return { error: "Worker and period are required." }

  const scores = [attendance, productivity, quality, teamwork, discipline]
  if (scores.some(s => isNaN(s) || s < 0 || s > 100)) {
    return { error: "All scores must be between 0 and 100." }
  }

  const totalScore   = scores.reduce((a, b) => a + b, 0)          // 0–500
  const scorePercent = (totalScore / MAX_SCORE) * 100               // 0–100
  const { rating, bonus: bonusScore, recommendation } = computeRating(totalScore)

  const worker = await prisma.worker.findUnique({ where: { id: workerId } })
  const aiSummary = worker
    ? `${worker.name} scored ${totalScore}/${MAX_SCORE} (${rating}). Recommendation: ${recommendation}`
    : null

  await prisma.performanceRecord.create({
    data: {
      workerId, period,
      attendance, productivity, quality, teamwork, discipline,
      totalScore, scorePercent, rating, bonusScore,
      managerNote, aiSummary, recommendation,
    },
  })

  revalidatePath("/hr/performance")
  return { success: true }
}
