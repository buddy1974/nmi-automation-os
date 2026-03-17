"use client"

import { useState } from "react"

// ── 10.2 Costs ────────────────────────────────────────────────────────────────

type CostType = "printing" | "editing" | "cover" | "layout" | "transport" | "other"

type CostRecord = {
  id: number
  book: string
  type: CostType
  amount: number
  date: string
  notes: string
}

// ── 10.3 Sales ────────────────────────────────────────────────────────────────

type SalesRecord = {
  id: number
  book: string
  qty: number
  price: number
  total: number
  date: string
  customer: string
}

// ── 10.4 Royalties ────────────────────────────────────────────────────────────

type RoyaltyRecord = {
  id: number
  author: string
  book: string
  amount: number
  date: string
}

// ── 10.6 Book report ──────────────────────────────────────────────────────────

type BookReport = {
  book: string
  sales: number
  costs: number
  royalties: number
  profit: number
}

// ── 10.7 Author report ────────────────────────────────────────────────────────

type AuthorReport = {
  author: string
  royaltiesTotal: number
  salesTotal: number
}

// ─────────────────────────────────────────────────────────────────────────────

export default function AccountingPage() {

  // 10.2 — Cost state
  const [costs, setCosts]         = useState<CostRecord[]>([])
  const [costBook, setCostBook]   = useState("")
  const [costType, setCostType]   = useState<CostType>("printing")
  const [costAmount, setCostAmount] = useState("")
  const [costNotes, setCostNotes] = useState("")

  // 10.3 — Sales state
  const [sales, setSales]             = useState<SalesRecord[]>([])
  const [saleBook, setSaleBook]       = useState("")
  const [saleQty, setSaleQty]         = useState("")
  const [salePrice, setSalePrice]     = useState("")
  const [saleCustomer, setSaleCustomer] = useState("")

  // 10.4 — Royalty state
  const [royalties, setRoyalties]         = useState<RoyaltyRecord[]>([])
  const [royaltyAuthor, setRoyaltyAuthor] = useState("")
  const [royaltyBook, setRoyaltyBook]     = useState("")
  const [royaltyAmount, setRoyaltyAmount] = useState("")


  // ── Forms ───────────────────────────────────────────────────────────────────

  function addCost() {

    if (!costBook) return

    setCosts([...costs, {
      id: Date.now(),
      book: costBook,
      type: costType,
      amount: Number(costAmount),
      date: new Date().toLocaleDateString(),
      notes: costNotes
    }])

    setCostBook("")
    setCostAmount("")
    setCostNotes("")

  }


  function addSale() {

    if (!saleBook) return

    const qty   = Number(saleQty)
    const price = Number(salePrice)

    setSales([...sales, {
      id: Date.now(),
      book: saleBook,
      qty,
      price,
      total: qty * price,
      date: new Date().toLocaleDateString(),
      customer: saleCustomer
    }])

    setSaleBook("")
    setSaleQty("")
    setSalePrice("")
    setSaleCustomer("")

  }


  function addRoyalty() {

    if (!royaltyAuthor) return

    setRoyalties([...royalties, {
      id: Date.now(),
      author: royaltyAuthor,
      book: royaltyBook,
      amount: Number(royaltyAmount),
      date: new Date().toLocaleDateString()
    }])

    setRoyaltyAuthor("")
    setRoyaltyBook("")
    setRoyaltyAmount("")

  }


  // ── 10.5 / 10.6 — Book report (computed) ────────────────────────────────────

  const allBooks = [...new Set([
    ...costs.map(c => c.book),
    ...sales.map(s => s.book),
    ...royalties.map(r => r.book)
  ])]

  const bookReports: BookReport[] = allBooks.map(book => {

    const bookSales     = sales.filter(s => s.book === book).reduce((sum, s) => sum + s.total, 0)
    const bookCosts     = costs.filter(c => c.book === book).reduce((sum, c) => sum + c.amount, 0)
    const bookRoyalties = royalties.filter(r => r.book === book).reduce((sum, r) => sum + r.amount, 0)

    return {
      book,
      sales:     bookSales,
      costs:     bookCosts,
      royalties: bookRoyalties,
      profit:    bookSales - bookCosts - bookRoyalties
    }

  })


  // ── 10.7 — Author report (computed) ─────────────────────────────────────────

  const allAuthors = [...new Set(royalties.map(r => r.author))]

  const authorReports: AuthorReport[] = allAuthors.map(author => {

    const authorRoyalties = royalties
      .filter(r => r.author === author)
      .reduce((sum, r) => sum + r.amount, 0)

    const authorBooks = [...new Set(
      royalties.filter(r => r.author === author).map(r => r.book)
    )]

    const authorSales = sales
      .filter(s => authorBooks.includes(s.book))
      .reduce((sum, s) => sum + s.total, 0)

    return {
      author,
      royaltiesTotal: authorRoyalties,
      salesTotal:     authorSales
    }

  })


  // ── 10.8 — Global totals (computed) ─────────────────────────────────────────

  const totalSales     = sales.reduce((sum, s) => sum + s.total, 0)
  const totalCosts     = costs.reduce((sum, c) => sum + c.amount, 0)
  const totalRoyalties = royalties.reduce((sum, r) => sum + r.amount, 0)
  const totalProfit    = totalSales - totalCosts - totalRoyalties


  // ── Render ───────────────────────────────────────────────────────────────────

  return (

    <div>

      <h1>Accounting</h1>


      {/* ── 10.2 Costs ─────────────────────────────────────────────────────── */}

      <h2>Costs</h2>

      <input
        placeholder="Book"
        value={costBook}
        onChange={(e) => setCostBook(e.target.value)}
      />

      <select
        value={costType}
        onChange={(e) => setCostType(e.target.value as CostType)}
      >
        <option value="printing">Printing</option>
        <option value="editing">Editing</option>
        <option value="cover">Cover</option>
        <option value="layout">Layout</option>
        <option value="transport">Transport</option>
        <option value="other">Other</option>
      </select>

      <input
        placeholder="Amount"
        value={costAmount}
        onChange={(e) => setCostAmount(e.target.value)}
      />

      <input
        placeholder="Notes"
        value={costNotes}
        onChange={(e) => setCostNotes(e.target.value)}
      />

      <button onClick={addCost}>Add Cost</button>

      {costs.map(c => (
        <div key={c.id}>
          {c.book} — {c.type} — {c.amount} — {c.date} — {c.notes}
        </div>
      ))}


      {/* ── 10.3 Sales ─────────────────────────────────────────────────────── */}

      <h2>Sales</h2>

      <input
        placeholder="Book"
        value={saleBook}
        onChange={(e) => setSaleBook(e.target.value)}
      />

      <input
        placeholder="Qty"
        value={saleQty}
        onChange={(e) => setSaleQty(e.target.value)}
      />

      <input
        placeholder="Price"
        value={salePrice}
        onChange={(e) => setSalePrice(e.target.value)}
      />

      <input
        placeholder="Customer"
        value={saleCustomer}
        onChange={(e) => setSaleCustomer(e.target.value)}
      />

      <button onClick={addSale}>Add Sale</button>

      {sales.map(s => (
        <div key={s.id}>
          {s.book} — qty: {s.qty} — price: {s.price} — total: {s.total} — {s.customer} — {s.date}
        </div>
      ))}


      {/* ── 10.4 Royalties ─────────────────────────────────────────────────── */}

      <h2>Royalties</h2>

      <input
        placeholder="Author"
        value={royaltyAuthor}
        onChange={(e) => setRoyaltyAuthor(e.target.value)}
      />

      <input
        placeholder="Book"
        value={royaltyBook}
        onChange={(e) => setRoyaltyBook(e.target.value)}
      />

      <input
        placeholder="Amount"
        value={royaltyAmount}
        onChange={(e) => setRoyaltyAmount(e.target.value)}
      />

      <button onClick={addRoyalty}>Add Royalty</button>

      {royalties.map(r => (
        <div key={r.id}>
          {r.author} — {r.book} — {r.amount} — {r.date}
        </div>
      ))}


      {/* ── 10.6 Book report ───────────────────────────────────────────────── */}

      <h2>Book Report</h2>

      <table>
        <thead>
          <tr>
            <th>Book</th>
            <th>Sales</th>
            <th>Costs</th>
            <th>Royalties</th>
            <th>Profit</th>
          </tr>
        </thead>
        <tbody>
          {bookReports.map((b, i) => (
            <tr key={i}>
              <td>{b.book}</td>
              <td>{b.sales}</td>
              <td>{b.costs}</td>
              <td>{b.royalties}</td>
              <td>{b.profit}</td>
            </tr>
          ))}
        </tbody>
      </table>


      {/* ── 10.7 Author report ─────────────────────────────────────────────── */}

      <h2>Author Report</h2>

      <table>
        <thead>
          <tr>
            <th>Author</th>
            <th>Royalties Total</th>
            <th>Sales Total</th>
          </tr>
        </thead>
        <tbody>
          {authorReports.map((a, i) => (
            <tr key={i}>
              <td>{a.author}</td>
              <td>{a.royaltiesTotal}</td>
              <td>{a.salesTotal}</td>
            </tr>
          ))}
        </tbody>
      </table>


      {/* ── 10.8 Global report ─────────────────────────────────────────────── */}

      <h2>Global Report</h2>

      <div>Total Sales: {totalSales}</div>
      <div>Total Costs: {totalCosts}</div>
      <div>Total Royalties: {totalRoyalties}</div>
      <div>Total Profit: {totalProfit}</div>


    </div>

  )

}
