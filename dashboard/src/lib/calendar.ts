import { getValidToken } from "./google"
import Anthropic         from "@anthropic-ai/sdk"

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const BASE = "https://www.googleapis.com/calendar/v3"

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CalendarEvent {
  id:          string
  summary:     string
  description?: string
  start:       { dateTime?: string; date?: string; timeZone?: string }
  end:         { dateTime?: string; date?: string; timeZone?: string }
  attendees?:  { email: string; displayName?: string }[]
  location?:   string
  htmlLink?:   string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function calFetch(userId: string, path: string, opts: RequestInit = {}): Promise<Response> {
  const token = await getValidToken(userId)
  if (!token) throw new Error("No Google token — please connect your account")
  return fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      Authorization:  `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(opts.headers ?? {}),
    },
  })
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getTodayEvents(userId: string): Promise<CalendarEvent[]> {
  const now      = new Date()
  const dayStart = new Date(now); dayStart.setHours(0, 0, 0, 0)
  const dayEnd   = new Date(now); dayEnd.setHours(23, 59, 59, 999)

  const params = new URLSearchParams({
    timeMin:      dayStart.toISOString(),
    timeMax:      dayEnd.toISOString(),
    singleEvents: "true",
    orderBy:      "startTime",
    maxResults:   "20",
  })

  const res = await calFetch(userId, `/calendars/primary/events?${params}`)
  if (!res.ok) throw new Error("Failed to fetch calendar events")
  const data = await res.json() as { items?: CalendarEvent[] }
  return data.items ?? []
}

export async function getWeekEvents(userId: string): Promise<CalendarEvent[]> {
  const now     = new Date()
  const weekEnd = new Date(now); weekEnd.setDate(weekEnd.getDate() + 7)

  const params = new URLSearchParams({
    timeMin:      now.toISOString(),
    timeMax:      weekEnd.toISOString(),
    singleEvents: "true",
    orderBy:      "startTime",
    maxResults:   "50",
  })

  const res = await calFetch(userId, `/calendars/primary/events?${params}`)
  if (!res.ok) throw new Error("Failed to fetch week events")
  const data = await res.json() as { items?: CalendarEvent[] }
  return data.items ?? []
}

export async function createEvent(
  userId: string,
  event: { title: string; start: string; end: string; description?: string; attendees?: string[] },
): Promise<CalendarEvent> {
  const body = {
    summary:     event.title,
    description: event.description,
    start:       { dateTime: event.start, timeZone: "Africa/Douala" },
    end:         { dateTime: event.end,   timeZone: "Africa/Douala" },
    attendees:   event.attendees?.map(e => ({ email: e })),
  }

  const res = await calFetch(userId, "/calendars/primary/events", {
    method: "POST",
    body:   JSON.stringify(body),
  })
  if (!res.ok) throw new Error("Failed to create calendar event")
  return res.json() as Promise<CalendarEvent>
}

// ── AI meeting prep ───────────────────────────────────────────────────────────

export async function getMeetingPrepNotes(event: CalendarEvent): Promise<string> {
  const attendeeList = event.attendees?.map(a => a.displayName ?? a.email).join(", ") ?? "no attendees listed"
  const startTime    = event.start.dateTime
    ? new Date(event.start.dateTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : event.start.date ?? ""

  const msg = await ai.messages.create({
    model:      "claude-sonnet-4-6",
    max_tokens: 600,
    system:     "You are preparing the CEO of NMI Education for meetings. Be concise, strategic, and actionable.",
    messages:   [{
      role:    "user",
      content: `Generate meeting prep notes for the CEO of NMI Education.

Meeting: ${event.summary}
Time: ${startTime}
Attendees: ${attendeeList}
Description: ${event.description ?? "No description"}
Location: ${event.location ?? "Not specified"}

Provide:
## Key Objectives
## Talking Points (3-5 bullets)
## Questions to Ask
## Desired Outcomes
## Context & Background

Keep it under 300 words. Be specific to NMI Education's context (Cameroonian educational publisher).`,
    }],
  })

  return msg.content[0]?.type === "text" ? msg.content[0].text : "Prep notes unavailable."
}
