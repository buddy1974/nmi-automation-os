import { getValidToken } from "./google"

const BASE = "https://gmail.googleapis.com/gmail/v1/users/me"

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GmailMessage {
  id:       string
  threadId: string
  snippet:  string
  payload?: {
    headers:  { name: string; value: string }[]
    body?:    { data?: string }
    parts?:   { mimeType: string; body: { data?: string } }[]
  }
  labelIds?: string[]
  internalDate?: string
}

export interface GmailSummary {
  id:      string
  from:    string
  subject: string
  date:    string
  snippet: string
  unread:  boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function gmailFetch(userId: string, path: string, opts: RequestInit = {}): Promise<Response> {
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

function decodeBase64(data: string): string {
  try {
    return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8")
  } catch {
    return ""
  }
}

function encodeBase64(data: string): string {
  return Buffer.from(data).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
}

function getHeader(msg: GmailMessage, name: string): string {
  return msg.payload?.headers?.find(h => h.name.toLowerCase() === name.toLowerCase())?.value ?? ""
}

function getBody(msg: GmailMessage): string {
  const payload = msg.payload
  if (!payload) return ""
  // Try direct body
  if (payload.body?.data) return decodeBase64(payload.body.data)
  // Try parts (multipart)
  const textPart = payload.parts?.find(p => p.mimeType === "text/plain")
  if (textPart?.body?.data) return decodeBase64(textPart.body.data)
  const htmlPart = payload.parts?.find(p => p.mimeType === "text/html")
  if (htmlPart?.body?.data) return decodeBase64(htmlPart.body.data)
  return ""
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getRecentEmails(userId: string, maxResults = 20): Promise<GmailSummary[]> {
  const listRes = await gmailFetch(userId, `/messages?maxResults=${maxResults}`)
  if (!listRes.ok) throw new Error("Failed to fetch Gmail messages")
  const list = await listRes.json() as { messages?: { id: string }[] }
  if (!list.messages?.length) return []

  const messages = await Promise.all(
    list.messages.slice(0, maxResults).map(async ({ id }) => {
      const res = await gmailFetch(userId, `/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`)
      if (!res.ok) return null
      return res.json() as Promise<GmailMessage>
    })
  )

  return messages
    .filter((m): m is GmailMessage => m !== null)
    .map(m => ({
      id:      m.id,
      from:    getHeader(m, "From"),
      subject: getHeader(m, "Subject"),
      date:    getHeader(m, "Date"),
      snippet: m.snippet ?? "",
      unread:  m.labelIds?.includes("UNREAD") ?? false,
    }))
}

export async function getEmailBody(userId: string, messageId: string): Promise<GmailMessage & { body: string }> {
  const res = await gmailFetch(userId, `/messages/${messageId}?format=full`)
  if (!res.ok) throw new Error("Failed to fetch email")
  const msg = await res.json() as GmailMessage
  return { ...msg, body: getBody(msg) }
}

export async function searchEmails(userId: string, query: string, maxResults = 10): Promise<GmailSummary[]> {
  const params = new URLSearchParams({ q: query, maxResults: String(maxResults) })
  const listRes = await gmailFetch(userId, `/messages?${params}`)
  if (!listRes.ok) return []
  const list = await listRes.json() as { messages?: { id: string }[] }
  if (!list.messages?.length) return []

  const messages = await Promise.all(
    list.messages.slice(0, maxResults).map(async ({ id }) => {
      const res = await gmailFetch(userId, `/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`)
      if (!res.ok) return null
      return res.json() as Promise<GmailMessage>
    })
  )

  return messages
    .filter((m): m is GmailMessage => m !== null)
    .map(m => ({
      id:      m.id,
      from:    getHeader(m, "From"),
      subject: getHeader(m, "Subject"),
      date:    getHeader(m, "Date"),
      snippet: m.snippet ?? "",
      unread:  m.labelIds?.includes("UNREAD") ?? false,
    }))
}

export async function sendEmail(
  userId: string,
  { to, subject, body }: { to: string; subject: string; body: string },
): Promise<string> {
  const raw = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "",
    body,
  ].join("\r\n")

  const res = await gmailFetch(userId, "/messages/send", {
    method: "POST",
    body:   JSON.stringify({ raw: encodeBase64(raw) }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Failed to send email: ${err}`)
  }
  const sent = await res.json() as { id: string }
  return sent.id
}

export async function draftEmail(
  userId: string,
  { to, subject, body }: { to: string; subject: string; body: string },
): Promise<string> {
  const raw = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "",
    body,
  ].join("\r\n")

  const res = await gmailFetch(userId, "/drafts", {
    method: "POST",
    body:   JSON.stringify({ message: { raw: encodeBase64(raw) } }),
  })
  if (!res.ok) throw new Error("Failed to create draft")
  const draft = await res.json() as { id: string }
  return draft.id
}

export async function markAsRead(userId: string, messageId: string): Promise<void> {
  await gmailFetch(userId, `/messages/${messageId}/modify`, {
    method: "POST",
    body:   JSON.stringify({ removeLabelIds: ["UNREAD"] }),
  })
}
