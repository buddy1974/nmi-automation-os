import { prisma }  from "@/lib/db"
import Anthropic   from "@anthropic-ai/sdk"
import type { AgentResult } from "./index"

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

function businessDaysAgo(days: number): Date {
  const d = new Date()
  let count = 0
  while (count < days) {
    d.setDate(d.getDate() - 1)
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6) count++
  }
  return d
}

export async function runHrPulse(companyId?: string): Promise<AgentResult> {
  const fiveBizDaysAgo  = businessDaysAgo(5)
  const threeDaysAgo    = new Date(); threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
  const ninetyDaysAgo   = new Date(); ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  const now             = new Date()

  // Workers with no work session in last 5 business days
  const recentWorkerIds = await prisma.workSession.findMany({
    where:  { clockIn: { gte: fiveBizDaysAgo }, ...(companyId ? { companyId } : {}) },
    select: { workerId: true },
    distinct: ["workerId"],
  })
  const activeIds = recentWorkerIds.map(s => s.workerId)

  const allWorkers = await prisma.worker.findMany({
    where:  { status: "active", ...(companyId ? { companyId } : {}) },
    select: { id: true, name: true, department: true },
  })

  const absentWorkers = allWorkers.filter(w => !activeIds.includes(String(w.id)))

  // Tasks overdue by more than 3 days
  const overdueTasks = await prisma.task.findMany({
    where: {
      status:  { not: "done" },
      dueDate: { lt: threeDaysAgo },
      ...(companyId ? { companyId } : {}),
    },
    select: { id: true, title: true, ownerName: true, dueDate: true },
    take:   20,
  })

  // Workers with no evaluation in last 90 days
  const recentEvalWorkerIds = await prisma.evaluationSession.findMany({
    where:  { createdAt: { gte: ninetyDaysAgo }, ...(companyId ? { companyId } : {}) },
    select: { workerId: true },
    distinct: ["workerId"],
  })
  const evaluatedIds      = recentEvalWorkerIds.map(e => e.workerId)
  const unevaluatedWorkers = allWorkers.filter(w => !evaluatedIds.includes(String(w.id)))

  let notificationsCreated = 0

  // Create notifications for absent workers
  for (const w of absentWorkers.slice(0, 10)) {
    await prisma.notification.create({
      data: {
        type:      "hr_absence_alert",
        title:     `No activity: ${w.name}`,
        message:   `${w.name} (${w.department ?? "—"}) has no recorded work session in the last 5 business days.`,
        severity:  "medium",
        companyId: companyId ?? null,
      },
    })
    notificationsCreated++
  }

  // Create notifications for overdue tasks
  for (const t of overdueTasks.slice(0, 10)) {
    const daysLate = Math.floor((now.getTime() - (t.dueDate?.getTime() ?? 0)) / 86400000)
    await prisma.notification.create({
      data: {
        type:      "hr_task_overdue",
        title:     `Overdue task: ${t.title.slice(0, 60)}`,
        message:   `Assigned to ${t.ownerName ?? "unassigned"} — ${daysLate} days overdue.`,
        severity:  daysLate > 7 ? "high" : "medium",
        companyId: companyId ?? null,
      },
    })
    notificationsCreated++
  }

  // Draft HR summary email
  const summaryLines: string[] = []
  if (absentWorkers.length > 0)    summaryLines.push(`${absentWorkers.length} worker(s) with no recent activity`)
  if (overdueTasks.length > 0)     summaryLines.push(`${overdueTasks.length} overdue task(s)`)
  if (unevaluatedWorkers.length > 0) summaryLines.push(`${unevaluatedWorkers.length} worker(s) without a recent evaluation`)

  if (summaryLines.length > 0) {
    const msg = await ai.messages.create({
      model:      "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages:   [{
        role:    "user",
        content: `Write a concise HR pulse alert email from the NMI Automation system to the HR Manager. Key findings: ${summaryLines.join("; ")}. Be factual, professional, and suggest follow-up actions. Under 150 words. Output only the email body.`,
      }],
    })

    const body = msg.content[0]?.type === "text" ? msg.content[0].text : ""

    await prisma.emailLog.create({
      data: {
        from:     "hr-agent@nmi-education.com",
        subject:  `HR Pulse Alert — ${new Date().toISOString().slice(0, 10)}`,
        body,
        category: "hr",
        priority: "high",
        routedTo: "HR Manager",
        handled:  false,
        companyId: companyId ?? null,
      },
    })
  }

  const totalActions = notificationsCreated + (summaryLines.length > 0 ? 1 : 0)

  return {
    actions: totalActions,
    summary: `Found ${absentWorkers.length} absent workers, ${overdueTasks.length} overdue tasks, ${unevaluatedWorkers.length} unevaluated workers`,
    details: {
      absentWorkers:      absentWorkers.length,
      overdueTasks:       overdueTasks.length,
      unevaluatedWorkers: unevaluatedWorkers.length,
      notificationsCreated,
    },
  }
}
