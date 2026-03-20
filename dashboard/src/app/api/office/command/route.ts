import { NextRequest, NextResponse } from "next/server"
import { requireAuth }               from "@/lib/api-auth"
import Anthropic                     from "@anthropic-ai/sdk"

const ai      = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
const ALLOWED = ["owner", "admin"]

export interface CommandResult {
  action:   string
  message:  string
  url?:     string
  data?:    Record<string, unknown>
}

const SYSTEM = `You are the NMI OS command interpreter for the CEO of NMI Education (Cameroonian educational publisher).

Parse the user's natural-language command and return a JSON object with:
- "action": one of: navigate, search_email, draft_email, calendar_event, briefing, agent_run, open_page, unknown
- "message": short human-readable confirmation or result description
- "url": optional — the internal URL to navigate to (e.g. "/office", "/agents", "/briefing", "/orders", "/sales")
- "data": optional — extracted parameters (e.g. { to, subject, body } for draft_email)

Navigation targets:
/office → CEO Office
/dashboard → Dashboard
/orders → Orders
/sales → Sales
/agents → AI Agents
/briefing → Daily Briefing
/customers → Customers
/invoices → Invoices
/finance → Finance
/hr → HR
/knowledge → Knowledge Base
/email → Email
/automation → Automation

Only return valid JSON. No markdown.`

export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  if (!ALLOWED.includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { command } = await req.json() as { command: string }
  if (!command?.trim()) {
    return NextResponse.json({ error: "Empty command" }, { status: 400 })
  }

  try {
    const msg = await ai.messages.create({
      model:      "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system:     SYSTEM,
      messages:   [{ role: "user", content: command }],
    })

    const text = msg.content[0]?.type === "text" ? msg.content[0].text.trim() : "{}"
    const result: CommandResult = JSON.parse(text)
    return NextResponse.json(result)
  } catch (err) {
    console.error("Command parse error:", err)
    return NextResponse.json({
      action:  "unknown",
      message: "Could not understand that command. Try: 'go to orders' or 'draft email to...'",
    })
  }
}
