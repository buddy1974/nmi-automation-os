import Anthropic from "@anthropic-ai/sdk"

export type DocumentType = "school_order" | "author_submission" | "delivery_note" | "invoice" | "general"
export type MediaType    = "image/jpeg" | "image/png" | "image/webp" | "image/gif"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ScanResult = Record<string, any>

const FIELD_SCHEMAS: Record<DocumentType, string> = {
  school_order: JSON.stringify({
    schoolName: "", principalName: "", phone: "", region: "", city: "",
    books: [{ code: "", title: "", quantity: 0 }],
    totalAmount: "", deliveryAddress: "", notes: "", confidence: "high|medium|low",
  }),
  author_submission: JSON.stringify({
    authorName: "", phone: "", email: "", manuscriptTitle: "",
    subject: "", level: "", description: "", submittedDate: "", notes: "",
    confidence: "high|medium|low",
  }),
  delivery_note: JSON.stringify({
    orderNumber: "", customerName: "", deliveryAddress: "",
    items: [{ code: "", title: "", quantity: 0 }],
    deliveryDate: "", driverName: "", notes: "", confidence: "high|medium|low",
  }),
  invoice: JSON.stringify({
    invoiceNumber: "", customerName: "", customerAddress: "",
    items: [{ description: "", quantity: 0, unitPrice: "", total: "" }],
    subtotal: "", total: "", dueDate: "", issueDate: "", notes: "",
    confidence: "high|medium|low",
  }),
  general: JSON.stringify({
    title: "", names: [], phones: [], emails: [],
    addresses: [], amounts: [], dates: [], items: [], notes: "",
    confidence: "high|medium|low",
  }),
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function scanDocument(
  imageBase64: string,
  mediaType: MediaType,
  documentType: DocumentType,
): Promise<ScanResult> {
  const response = await anthropic.messages.create({
    model:      "claude-sonnet-4-6",
    max_tokens: 1500,
    system: `You are a document scanning assistant for NMI Education, a Cameroonian publishing and printing company based in Yaoundé and Douala. Extract all relevant information from document images and return ONLY valid JSON matching the schema provided. No markdown, no explanations, no code blocks — raw JSON only.`,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: imageBase64 },
          },
          {
            type: "text",
            text: `Extract all information from this ${documentType.replace(/_/g, " ")} document and return JSON matching this schema exactly:\n${FIELD_SCHEMAS[documentType]}`,
          },
        ],
      },
    ],
  })

  const raw     = response.content[0].type === "text" ? response.content[0].text.trim() : "{}"
  const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim()

  try {
    return JSON.parse(cleaned) as ScanResult
  } catch {
    return { error: "Could not parse document", raw: cleaned, confidence: "low" }
  }
}
