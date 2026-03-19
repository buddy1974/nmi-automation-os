"use server"

import { prisma }         from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function createPerformanceRecord(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {

  const workerId    = Number(formData.get("workerId"))
  const period      = (formData.get("period")      as string)?.trim()
  const attendance  = Number(formData.get("attendance"))
  const productivity = Number(formData.get("productivity"))
  const quality     = Number(formData.get("quality"))
  const teamwork    = Number(formData.get("teamwork"))
  const discipline  = Number(formData.get("discipline"))
  const managerNote = (formData.get("managerNote") as string)?.trim() || null

  if (!workerId || !period) {
    return { error: "Worker and period are required." }
  }

  const scores = [attendance, productivity, quality, teamwork, discipline]
  if (scores.some(s => isNaN(s) || s < 0 || s > 100)) {
    return { error: "All scores must be between 0 and 100." }
  }

  // Total score = average of 5 dimensions → 0–100
  const totalScore = scores.reduce((a, b) => a + b, 0) / 5

  await prisma.performanceRecord.create({
    data: {
      workerId,
      period,
      attendance,
      productivity,
      quality,
      teamwork,
      discipline,
      managerNote,
      totalScore,
      bonusScore: 0,   // calculated later by AI engine (17.4)
    },
  })

  revalidatePath("/hr/performance")
  return { success: true }
}
