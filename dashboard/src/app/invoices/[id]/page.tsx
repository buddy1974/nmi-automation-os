import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import InvoiceActions from "./InvoiceActions"

export const dynamic = "force-dynamic"

interface Props {
  params: { id: string }
}

const STATUS_COLOR: Record<string, string> = {
  draft:     "#888",
  issued:    "#2563eb",
  partial:   "#d97706",
  paid:      "#16a34a",
  cancelled: "#dc2626",
}

export default async function InvoiceDetailPage({ params }: Props) {

  const invoice = await prisma.invoice.findUnique({
    where: { id: Number(params.id) },
    include: {
      order: {
        include: {
          items: true,
        },
      },
    },
  })

  if (!invoice) notFound()

  const items   = invoice.order?.items ?? []
  const total   = Number(invoice.amount)
  const paid    = Number(invoice.paid)
  const balance = total - paid

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
        }

        .invoice-page {
          max-width: 800px;
          margin: 40px auto;
          padding: 40px;
          background: white;
          font-family: Arial, sans-serif;
          color: #111;
        }

        .invoice-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
          border-bottom: 2px solid #111;
          padding-bottom: 24px;
        }

        .company-block h1 {
          font-size: 22px;
          font-weight: 700;
          margin: 0 0 6px;
        }

        .company-block p {
          margin: 2px 0;
          font-size: 13px;
          color: #555;
        }

        .invoice-meta {
          text-align: right;
        }

        .invoice-meta h2 {
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 8px;
          color: #1a1a2e;
        }

        .invoice-meta p {
          margin: 3px 0;
          font-size: 13px;
        }

        .status-badge {
          display: inline-block;
          margin-top: 8px;
          padding: 3px 10px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          border: 1px solid currentColor;
        }

        .bill-to {
          margin-bottom: 32px;
        }

        .bill-to h3 {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #888;
          margin: 0 0 6px;
        }

        .bill-to p {
          font-size: 15px;
          font-weight: 600;
          margin: 0;
        }

        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 32px;
        }

        .items-table th {
          background: #1a1a2e;
          color: white;
          padding: 10px 12px;
          text-align: left;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .items-table th:last-child,
        .items-table td:last-child {
          text-align: right;
        }

        .items-table td {
          padding: 10px 12px;
          font-size: 13px;
          border-bottom: 1px solid #eee;
        }

        .items-table tr:nth-child(even) td {
          background: #f9f9f9;
        }

        .totals-block {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 40px;
        }

        .totals-table {
          width: 280px;
          border-collapse: collapse;
        }

        .totals-table td {
          padding: 7px 0;
          font-size: 13px;
        }

        .totals-table td:last-child {
          text-align: right;
          font-weight: 600;
        }

        .totals-table .grand-total td {
          font-size: 16px;
          font-weight: 700;
          border-top: 2px solid #111;
          padding-top: 10px;
        }

        .totals-table .balance-row td {
          color: #dc2626;
          font-weight: 700;
        }

        .totals-table .paid-row td {
          color: #16a34a;
        }

        .invoice-footer {
          text-align: center;
          font-size: 11px;
          color: #aaa;
          border-top: 1px solid #eee;
          padding-top: 20px;
        }
      `}</style>

      <div className="invoice-page">

        {/* Interactive actions — print button + payment form */}
        <InvoiceActions invoiceId={invoice.id} status={invoice.status} />

        {/* Header */}
        <div className="invoice-header">

          <div className="company-block">
            <h1>NMI EDUCATION SARL</h1>
            <p>Yaoundé, Cameroun</p>
            <p>Tel: +237 000 000 000</p>
            <p>Email: contact@nmieducation.com</p>
            <p>www.nmieducation.com</p>
          </div>

          <div className="invoice-meta">
            <h2>INVOICE</h2>
            <p><strong>N°:</strong> {invoice.number}</p>
            <p><strong>Date:</strong> {new Date(invoice.createdAt).toLocaleDateString("fr-CM", { day: "2-digit", month: "long", year: "numeric" })}</p>
            <p><strong>Due:</strong> {new Date(invoice.dueDate).toLocaleDateString("fr-CM", { day: "2-digit", month: "long", year: "numeric" })}</p>
            <p><strong>Order:</strong> {invoice.order?.number ?? "—"}</p>
            <span
              className="status-badge"
              style={{ color: STATUS_COLOR[invoice.status] ?? "#888" }}
            >
              {invoice.status}
            </span>
          </div>

        </div>

        {/* Bill To */}
        <div className="bill-to">
          <h3>Bill To</h3>
          <p>{invoice.customerName || "—"}</p>
        </div>

        {/* Items table */}
        <table className="items-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Title</th>
              <th style={{ textAlign: "center" }}>Qty</th>
              <th style={{ textAlign: "right" }}>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", color: "#aaa" }}>No items</td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  <td>{item.productCode}</td>
                  <td>{item.title}</td>
                  <td style={{ textAlign: "center" }}>{item.qty}</td>
                  <td style={{ textAlign: "right" }}>{Number(item.price).toLocaleString()} FCFA</td>
                  <td>{Number(item.lineTotal).toLocaleString()} FCFA</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Totals */}
        <div className="totals-block">
          <table className="totals-table">
            <tbody>
              <tr className="grand-total">
                <td>Total</td>
                <td>{total.toLocaleString()} FCFA</td>
              </tr>
              <tr className="paid-row">
                <td>Paid</td>
                <td>{paid.toLocaleString()} FCFA</td>
              </tr>
              {balance > 0 && (
                <tr className="balance-row">
                  <td>Balance due</td>
                  <td>{balance.toLocaleString()} FCFA</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="invoice-footer">
          <p>NMI Education SARL — Thank you for your order.</p>
          <p>This invoice was generated by NMI Automation OS.</p>
        </div>

      </div>
    </>
  )
}
