import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

interface Props {
  params: { id: string }
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

  const items = invoice.order?.items ?? []

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

        .invoice-meta .status-badge {
          display: inline-block;
          margin-top: 8px;
          padding: 3px 10px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          background: #f0f4ff;
          color: #1a1a2e;
          border: 1px solid #c7d2fe;
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
          width: 260px;
        }

        .totals-table tr td {
          padding: 6px 0;
          font-size: 13px;
        }

        .totals-table tr td:last-child {
          text-align: right;
          font-weight: 600;
        }

        .totals-table .grand-total td {
          font-size: 16px;
          font-weight: 700;
          border-top: 2px solid #111;
          padding-top: 10px;
        }

        .invoice-footer {
          text-align: center;
          font-size: 11px;
          color: #aaa;
          border-top: 1px solid #eee;
          padding-top: 20px;
        }

        .print-btn {
          display: inline-block;
          margin-bottom: 24px;
          padding: 8px 20px;
          background: #1a1a2e;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
        }

        .back-link {
          display: inline-block;
          margin-bottom: 24px;
          margin-right: 12px;
          font-size: 13px;
          color: #555;
          text-decoration: none;
        }

        .back-link:hover {
          text-decoration: underline;
        }
      `}</style>

      <div className="invoice-page">

        {/* Actions — hidden on print */}
        <div className="no-print" style={{ marginBottom: "8px" }}>
          <a href="/invoices" className="back-link">← Back to invoices</a>
          <button className="print-btn" onClick={() => window.print()}>
            Print
          </button>
        </div>

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
            <span className="status-badge">{invoice.status}</span>
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
              <th>Qty</th>
              <th>Unit Price</th>
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
              <tr>
                <td>Subtotal</td>
                <td>{Number(invoice.amount).toLocaleString()} FCFA</td>
              </tr>
              <tr className="grand-total">
                <td>Total</td>
                <td>{Number(invoice.amount).toLocaleString()} FCFA</td>
              </tr>
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
