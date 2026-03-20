import { NextResponse }   from "next/server"
import { prisma }         from "@/lib/db"
import { requireAuth }    from "@/lib/api-auth"
import { renderToBuffer } from "@react-pdf/renderer"
import { InvoiceReport }  from "@/lib/reports/InvoiceReport"
import React              from "react"

export const runtime = "nodejs"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const invoiceId = parseInt(id, 10)
    if (isNaN(invoiceId)) {
      return NextResponse.json({ error: "Invalid invoice ID", code: "VALIDATION" }, { status: 400 })
    }

    // Fetch invoice + order + line items
    const invoice = await prisma.invoice.findUnique({
      where:   { id: invoiceId },
      include: { order: { include: { items: true } } },
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found", code: "NOT_FOUND" }, { status: 404 })
    }

    const data = {
      invoice: {
        id:           invoice.id,
        number:       invoice.number,
        customerName: invoice.customerName,
        amount:       Number(invoice.amount),
        paid:         Number(invoice.paid),
        status:       invoice.status,
        dueDate:      invoice.dueDate,
        createdAt:    invoice.createdAt,
      },
      items: (invoice.order?.items ?? []).map(item => ({
        productCode: item.productCode,
        title:       item.title,
        qty:         item.qty,
        price:       Number(item.price),
        lineTotal:   Number(item.lineTotal),
      })),
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(React.createElement(InvoiceReport, data) as any)

    return new Response(new Uint8Array(buffer), {
      status:  200,
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${invoice.number}.pdf"`,
        "Cache-Control":       "no-store",
      },
    })

  } catch (err) {
    console.error("[GET /api/reports/invoice/[id]]", err)
    return NextResponse.json({ error: "Failed to generate PDF", code: "SERVER_ERROR" }, { status: 500 })
  }
}
