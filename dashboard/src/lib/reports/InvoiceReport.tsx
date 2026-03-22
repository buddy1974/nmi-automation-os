// @react-pdf/renderer — server-side only (Node.js runtime, never imported client-side)
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer"

export type InvoiceReportData = {
  invoice: {
    id:           number
    number:       string
    customerName: string
    amount:       number
    paid:         number
    status:       string
    dueDate:      Date
    createdAt:    Date
  }
  items: {
    productCode: string
    title:       string
    qty:         number
    price:       number
    lineTotal:   number
  }[]
}

const s = StyleSheet.create({
  page: {
    fontFamily:  "Helvetica",
    fontSize:     10,
    color:        "#1e293b",
    paddingTop:   48,
    paddingBottom: 48,
    paddingLeft:  52,
    paddingRight: 52,
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection:  "row",
    justifyContent: "space-between",
    alignItems:     "flex-start",
    marginBottom:   32,
    borderBottom:   "2px solid #1a73e8",
    paddingBottom:  16,
  },
  brand: { flexDirection: "column", gap: 2 },
  brandName: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#1a1a2e" },
  brandSub:  { fontSize: 9,  color: "#64748b" },
  invoiceLabel: {
    fontSize:    22,
    fontFamily:  "Helvetica-Bold",
    color:       "#1a73e8",
    letterSpacing: 1,
  },

  // ── Meta section ─────────────────────────────────────────────────────────────
  metaRow: {
    flexDirection:  "row",
    justifyContent: "space-between",
    marginBottom:   28,
  },
  metaBox: { flexDirection: "column", gap: 4 },
  metaLabel: { fontSize: 8, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8 },
  metaValue: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#1e293b" },

  // ── Table ─────────────────────────────────────────────────────────────────────
  tableHeader: {
    flexDirection:   "row",
    backgroundColor: "#f1f5f9",
    padding:         "7 10",
    borderRadius:    4,
    marginBottom:    2,
  },
  tableRow: {
    flexDirection: "row",
    padding:       "6 10",
    borderBottom:  "1px solid #f1f5f9",
  },
  colDesc:   { flex: 4 },
  colQty:    { flex: 1, textAlign: "center" },
  colPrice:  { flex: 2, textAlign: "right" },
  colTotal:  { flex: 2, textAlign: "right" },
  thText:    { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#475569", textTransform: "uppercase", letterSpacing: 0.5 },
  tdText:    { fontSize: 10, color: "#334155" },
  tdBold:    { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#1e293b" },
  codeText:  { fontSize: 8, color: "#94a3b8", marginTop: 1 },

  // ── Totals ────────────────────────────────────────────────────────────────────
  totalsWrap: { alignItems: "flex-end", marginTop: 16 },
  totalsBox: {
    width:         220,
    borderTop:     "1px solid #e2e8f0",
    paddingTop:    12,
  },
  totalLine: {
    flexDirection:  "row",
    justifyContent: "space-between",
    marginBottom:   5,
  },
  totalLabel:     { fontSize: 10, color: "#64748b" },
  totalValue:     { fontSize: 10, color: "#334155" },
  grandLabel:     { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#1e293b" },
  grandValue:     { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#1a73e8" },
  balanceDue:     { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#ef4444" },
  balancePaid:    { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#16a34a" },

  // ── Status badge ──────────────────────────────────────────────────────────────
  statusBadge: {
    alignSelf:       "flex-start",
    borderRadius:    4,
    paddingTop:      3,
    paddingBottom:   3,
    paddingLeft:     8,
    paddingRight:    8,
    marginTop:       4,
    fontSize:        9,
    fontFamily:      "Helvetica-Bold",
    textTransform:   "uppercase",
    letterSpacing:   0.5,
  },

  // ── Footer ────────────────────────────────────────────────────────────────────
  footer: {
    position:   "absolute",
    bottom:     32,
    left:       52,
    right:      52,
    borderTop:  "1px solid #e2e8f0",
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 8, color: "#94a3b8" },
})

function fmt(n: number): string {
  return n.toLocaleString("fr-CM")
}

function fmtDate(d: Date): string {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

function statusColors(status: string): { bg: string; color: string } {
  if (status === "paid")      return { bg: "#dcfce7", color: "#166534" }
  if (status === "overdue")   return { bg: "#fee2e2", color: "#991b1b" }
  if (status === "partial")   return { bg: "#fff7ed", color: "#9a3412" }
  if (status === "cancelled") return { bg: "#f1f5f9", color: "#475569" }
  return { bg: "#dbeafe", color: "#1d4ed8" } // issued / default
}

export function InvoiceReport({ invoice, items }: InvoiceReportData) {
  const balance    = invoice.amount - invoice.paid
  const sc         = statusColors(invoice.status)

  return (
    <Document title={`Invoice ${invoice.number}`} author="NMI Education">
      <Page size="A4" style={s.page}>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <View style={s.header}>
          <View style={s.brand}>
            <Text style={s.brandName}>NMI Education</Text>
            <Text style={s.brandSub}>BP 123, Yaoundé, Cameroon</Text>
            <Text style={s.brandSub}>contact@nmieducation.com · +237 222 000 000</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.invoiceLabel}>INVOICE</Text>
            <Text style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>{invoice.number}</Text>
            <View style={[s.statusBadge, { backgroundColor: sc.bg }]}>
              <Text style={{ color: sc.color }}>{invoice.status.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* ── Meta ───────────────────────────────────────────────────── */}
        <View style={s.metaRow}>
          <View style={s.metaBox}>
            <Text style={s.metaLabel}>Bill To</Text>
            <Text style={s.metaValue}>{invoice.customerName}</Text>
          </View>
          <View style={s.metaBox}>
            <Text style={s.metaLabel}>Invoice Date</Text>
            <Text style={s.metaValue}>{fmtDate(invoice.createdAt)}</Text>
          </View>
          <View style={s.metaBox}>
            <Text style={s.metaLabel}>Due Date</Text>
            <Text style={s.metaValue}>{fmtDate(invoice.dueDate)}</Text>
          </View>
          <View style={s.metaBox}>
            <Text style={s.metaLabel}>Payment Status</Text>
            <Text style={[s.metaValue, { color: balance > 0 ? "#ef4444" : "#16a34a" }]}>
              {balance > 0 ? `${fmt(balance)} XAF due` : "Fully paid"}
            </Text>
          </View>
        </View>

        {/* ── Items table ────────────────────────────────────────────── */}
        <View style={s.tableHeader}>
          <View style={s.colDesc}><Text style={s.thText}>Description</Text></View>
          <View style={s.colQty}><Text style={s.thText}>Qty</Text></View>
          <View style={s.colPrice}><Text style={s.thText}>Unit Price</Text></View>
          <View style={s.colTotal}><Text style={s.thText}>Total</Text></View>
        </View>

        {items.map((item, i) => (
          <View key={i} style={s.tableRow}>
            <View style={s.colDesc}>
              <Text style={s.tdBold}>{item.title}</Text>
              <Text style={s.codeText}>{item.productCode}</Text>
            </View>
            <View style={s.colQty}>
              <Text style={s.tdText}>{item.qty}</Text>
            </View>
            <View style={s.colPrice}>
              <Text style={s.tdText}>{fmt(item.price)} XAF</Text>
            </View>
            <View style={s.colTotal}>
              <Text style={s.tdBold}>{fmt(item.lineTotal)} XAF</Text>
            </View>
          </View>
        ))}

        {/* ── Totals ─────────────────────────────────────────────────── */}
        <View style={s.totalsWrap}>
          <View style={s.totalsBox}>
            <View style={s.totalLine}>
              <Text style={s.totalLabel}>Subtotal</Text>
              <Text style={s.totalValue}>{fmt(invoice.amount)} XAF</Text>
            </View>
            <View style={s.totalLine}>
              <Text style={s.totalLabel}>Amount Paid</Text>
              <Text style={s.balancePaid}>{fmt(invoice.paid)} XAF</Text>
            </View>
            <View style={[s.totalLine, { borderTop: "1px solid #e2e8f0", paddingTop: 8, marginTop: 4 }]}>
              <Text style={s.grandLabel}>Balance Due</Text>
              <Text style={balance > 0 ? s.balanceDue : s.balancePaid}>
                {fmt(balance)} XAF
              </Text>
            </View>
          </View>
        </View>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>NMI Education — Official Invoice</Text>
          <Text style={s.footerText}>Thank you for your business. Payment is due by {fmtDate(invoice.dueDate)}.</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
        </View>

      </Page>
    </Document>
  )
}
