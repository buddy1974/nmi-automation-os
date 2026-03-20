import { prisma }  from "@/lib/db"
import Anthropic   from "@anthropic-ai/sdk"
import type { AgentResult } from "./index"

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function runCompetitiveIntel(companyId?: string): Promise<AgentResult> {
  const today = new Date().toISOString().slice(0, 10)

  const msg = await ai.messages.create({
    model:      "claude-sonnet-4-6",
    max_tokens: 800,
    system:     "You are a business intelligence analyst specialising in Sub-Saharan African educational publishing markets. Be specific, data-informed, and actionable.",
    messages:   [{
      role:    "user",
      content: `Generate a competitive intelligence briefing for NMI Education, a Cameroonian publishing company that produces textbooks for primary and secondary schools in Cameroon and Central Africa.

Today's date: ${today}

Cover these areas:
1. **Market Trends** — What is happening in Cameroonian and Central African educational publishing right now?
2. **Key Competitors** — Who should NMI watch? What are they doing?
3. **Opportunities** — Where can NMI grow in the next 12 months?
4. **Threats** — Digital disruption, regulatory changes, economic factors?
5. **Recommendation** — One specific action NMI should take this quarter.

Be specific and actionable. Maximum 400 words. Use markdown headers (##).`,
    }],
  })

  const briefing = msg.content[0]?.type === "text" ? msg.content[0].text : "Briefing unavailable."

  await prisma.notification.create({
    data: {
      type:      "competitive_intel",
      title:     `Competitive Intelligence Briefing — ${today}`,
      message:   briefing,
      severity:  "info",
      companyId: companyId ?? null,
    },
  })

  return {
    actions: 1,
    summary: `Generated competitive intelligence briefing for ${today}`,
    details: { briefingGenerated: true, date: today },
  }
}
