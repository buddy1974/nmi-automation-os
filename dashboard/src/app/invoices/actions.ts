"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function updateInvoicePayment(invoiceId: number, amount: number) {

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } })
  if (!invoice) throw new Error("Invoice not found")

  const newPaid = Number(invoice.paid) + amount
  const total   = Number(invoice.amount)

  const status =
    newPaid <= 0        ? "issued"   :
    newPaid < total     ? "partial"  :
                          "paid"

  await prisma.invoice.update({
    where: { id: invoiceId },
    data:  { paid: newPaid, status },
  })

  revalidatePath(`/invoices/${invoiceId}`)
  revalidatePath("/invoices")
}
