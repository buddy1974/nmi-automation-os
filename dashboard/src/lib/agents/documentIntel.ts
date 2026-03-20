import { prisma }  from "@/lib/db"
import Anthropic   from "@anthropic-ai/sdk"
import type { AgentResult } from "./index"

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function runDocumentIntel(companyId?: string): Promise<AgentResult> {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const newDocs = await prisma.knowledgeDoc.findMany({
    where:  { createdAt: { gte: sevenDaysAgo }, active: true, ...(companyId ? { companyId } : {}) },
    orderBy: { createdAt: "desc" },
    take:   20,
  })

  let docsProcessed   = 0
  let actionItemsFound = 0

  for (const doc of newDocs) {
    try {
      const msg = await ai.messages.create({
        model:      "claude-haiku-4-5-20251001",
        max_tokens: 400,
        messages:   [{
          role:    "user",
          content: `Analyse this business document and extract structured information.

Document title: ${doc.title}
Category: ${doc.category}
Content: ${doc.content.slice(0, 2000)}

Respond with valid JSON only:
{
  "entities": ["list of key entities: names, dates, amounts, obligations, deadlines"],
  "summary": "2-sentence summary",
  "actionItems": ["list of specific action items, or empty array if none"]
}`,
        }],
      })

      const raw = msg.content[0]?.type === "text" ? msg.content[0].text : "{}"

      let parsed: { entities?: string[]; summary?: string; actionItems?: string[] } = {}
      try {
        // Extract JSON from response (may have markdown wrapping)
        const jsonMatch = raw.match(/\{[\s\S]*\}/)
        if (jsonMatch) parsed = JSON.parse(jsonMatch[0])
      } catch {
        // ignore parse errors
      }

      const entities    = Array.isArray(parsed.entities)    ? parsed.entities    : []
      const actionItems = Array.isArray(parsed.actionItems) ? parsed.actionItems : []

      // Update tags with extracted entities
      const existingTags = doc.tags ? doc.tags.split(",").map(t => t.trim()) : []
      const newTags      = [...new Set([...existingTags, ...entities.slice(0, 8)])].join(", ")

      await prisma.knowledgeDoc.update({
        where: { id: doc.id },
        data:  { tags: newTags },
      })

      // Create notification if action items found
      if (actionItems.length > 0) {
        await prisma.notification.create({
          data: {
            type:      "document_action_items",
            title:     `Action items in: ${doc.title}`,
            message:   `${parsed.summary ?? ""}\n\nAction items:\n${actionItems.map(a => `• ${a}`).join("\n")}`,
            severity:  "medium",
            companyId: companyId ?? null,
          },
        })
        actionItemsFound += actionItems.length
      }

      docsProcessed++
    } catch {
      // continue with next doc
    }
  }

  return {
    actions: docsProcessed,
    summary: `Processed ${docsProcessed} new documents, found ${actionItemsFound} action items`,
    details: { docsProcessed, actionItemsFound },
  }
}
