"use client"

import { useState } from "react"

type PrintStatus =
  | "planned"
  | "printing"
  | "printed"
  | "received"
  | "in_stock"

type PrintRecord = {
  id: number
  book: string
  quantity: number
  cost: number
  printer: string
  date: string
  status: PrintStatus
}

export default function PrintingPage() {

  const [records, setRecords] = useState<PrintRecord[]>([])

  const [book, setBook]         = useState("")
  const [quantity, setQuantity] = useState("")
  const [cost, setCost]         = useState("")
  const [printer, setPrinter]   = useState("")


  function addRecord() {

    if (!book) return

    const newRecord: PrintRecord = {
      id: Date.now(),
      book,
      quantity: Number(quantity),
      cost: Number(cost),
      printer,
      date: new Date().toLocaleDateString(),
      status: "planned"
    }

    setRecords([...records, newRecord])

    setBook("")
    setQuantity("")
    setCost("")
    setPrinter("")

  }


  function setStatus(id: number, status: PrintStatus) {
    setRecords(records.map(r => r.id === id ? { ...r, status } : r))
  }


  return (

    <div>

      <h1>Printing</h1>


      <h2>Add print record</h2>

      <input
        placeholder="Book"
        value={book}
        onChange={(e) => setBook(e.target.value)}
      />

      <input
        placeholder="Quantity"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
      />

      <input
        placeholder="Cost"
        value={cost}
        onChange={(e) => setCost(e.target.value)}
      />

      <input
        placeholder="Printer"
        value={printer}
        onChange={(e) => setPrinter(e.target.value)}
      />

      <button onClick={addRecord}>
        Add
      </button>


      <h2>List</h2>

      {records.map(r => (

        <div key={r.id}>

          <b>{r.book}</b> —
          qty: {r.quantity} —
          cost: {r.cost} —
          {r.printer} —
          {r.date} —
          <b>{r.status}</b>

          <div>
            <button onClick={() => setStatus(r.id, "planned")}>Planned</button>
            <button onClick={() => setStatus(r.id, "printing")}>Printing</button>
            <button onClick={() => setStatus(r.id, "printed")}>Printed</button>
            <button onClick={() => setStatus(r.id, "received")}>Received</button>
            <button onClick={() => setStatus(r.id, "in_stock")}>In Stock</button>
          </div>

        </div>

      ))}

    </div>

  )

}
