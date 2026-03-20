import { prisma }  from "@/lib/db"
import Anthropic   from "@anthropic-ai/sdk"
import type { AgentResult } from "./index"

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function runAuthorRelations(companyId?: string): Promise<AgentResult> {
  const sevenDaysAgo  = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const thirtyDaysOut = new Date(); thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30)

  // Manuscripts that changed status recently
  const recentManuscripts = await prisma.manuscript.findMany({
    where:   { date: { gte: sevenDaysAgo } },
    orderBy: { date: "desc" },
    take:    20,
  })

  // Royalties due soon
  const upcomingRoyalties = await prisma.royalty.findMany({
    where: {
      status:    "unpaid",
      date:      { lte: thirtyDaysOut },
      ...(companyId ? { companyId } : {}),
    },
    take: 20,
  })

  let emailsDrafted    = 0
  let manuscriptsCount = 0
  let royaltiesCount   = 0

  // Draft manuscript status emails
  for (const ms of recentManuscripts) {
    if (!ms.author) continue
    try {
      const msg = await ai.messages.create({
        model:      "claude-haiku-4-5-20251001",
        max_tokens: 250,
        messages:   [{
          role:    "user",
          content: `Write a brief professional author update email from NMI Education to author ${ms.author} about their manuscript "${ms.title}". Status: ${ms.status}. ${ms.readyForPrint ? "The manuscript has been approved and is ready for print." : "The manuscript is still under review."} Be encouraging and professional. Under 120 words. Output only the email body.`,
        }],
      })

      const body = msg.content[0]?.type === "text" ? msg.content[0].text : ""

      await prisma.emailLog.create({
        data: {
          from:     "editorial@nmi-education.com",
          subject:  `Update on "${ms.title}" — NMI Education`,
          body,
          category: "editorial",
          priority: "normal",
          routedTo: "Editorial Team",
          handled:  false,
          companyId: companyId ?? null,
        },
      })
      emailsDrafted++
      manuscriptsCount++
    } catch {
      // continue
    }
  }

  // Draft royalty notification emails
  for (const r of upcomingRoyalties) {
    try {
      const msg = await ai.messages.create({
        model:      "claude-haiku-4-5-20251001",
        max_tokens: 250,
        messages:   [{
          role:    "user",
          content: `Write a professional royalty payment notification email from NMI Education to author ${r.author}. Book: "${r.book}". Amount: ${Number(r.amount).toLocaleString()} XAF. Payment is being processed. Be professional and appreciative. Under 100 words. Output only the email body.`,
        }],
      })

      const body = msg.content[0]?.type === "text" ? msg.content[0].text : ""

      await prisma.emailLog.create({
        data: {
          from:     "royalties@nmi-education.com",
          subject:  `Royalty Payment Notification — "${r.book}"`,
          body,
          category: "editorial",
          priority: "normal",
          routedTo: "Editorial Team",
          handled:  false,
          companyId: companyId ?? null,
        },
      })
      emailsDrafted++
      royaltiesCount++
    } catch {
      // continue
    }
  }

  return {
    actions: emailsDrafted,
    summary: `Processed ${manuscriptsCount} manuscript updates and ${royaltiesCount} royalty alerts, drafted ${emailsDrafted} emails`,
    details: { manuscriptsUpdated: manuscriptsCount, royaltiesAlerted: royaltiesCount, emailsDrafted },
  }
}
