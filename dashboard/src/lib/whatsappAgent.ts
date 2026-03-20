import Anthropic from "@anthropic-ai/sdk"
import { prisma } from "@/lib/db"

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const SYSTEM_PROMPT = `You are a helpful customer support agent for NMI Education, a Cameroonian publishing company. You help customers with: book orders, pricing (books are 2500 XAF for primary, 3500 XAF for secondary), delivery information, author submissions, distributor inquiries. Be friendly, concise, and professional. Respond in the same language the customer uses (French or English). Never make up information you don't know.`

export async function generateWhatsAppReply(message: string): Promise<string> {
  try {
    const msg = await ai.messages.create({
      model:      "claude-sonnet-4-6",
      max_tokens: 300,
      system:     SYSTEM_PROMPT,
      messages:   [{ role: "user", content: message }],
    })
    return (msg.content[0] as { type: string; text: string }).text.trim()
  } catch {
    return "Thank you for contacting NMI Education. Our team will get back to you shortly. / Merci de contacter NMI Education. Notre équipe vous répondra bientôt."
  }
}

export async function saveMessage(params: {
  from:          string
  customerName?: string
  message:       string
  reply:         string
  companyId?:    string
}) {
  return prisma.whatsAppMessage.create({
    data: {
      from:         params.from,
      customerName: params.customerName ?? null,
      message:      params.message,
      reply:        params.reply,
      status:       "replied",
      companyId:    params.companyId ?? null,
    },
  })
}
