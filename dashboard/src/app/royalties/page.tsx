"use client"

import { useState } from "react"

type Royalty = {
  id: number
  author: string
  amount: number
  date: string
}

export default function RoyaltiesPage() {

  const [royalties, setRoyalties] = useState<Royalty[]>([])

  const [author, setAuthor] = useState("")
  const [amount, setAmount] = useState("")


  function addRoyalty() {

    if (!author) return

    const newRoyalty: Royalty = {

      id: Date.now(),

      author,

      amount: Number(amount),

      date: new Date().toLocaleDateString()

    }

    setRoyalties([...royalties, newRoyalty])

    setAuthor("")
    setAmount("")

  }


  return (

    <div>

      <h1>Royalties</h1>


      <h2>Add royalty</h2>

      <input
        placeholder="Author"
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
      />

      <input
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <button onClick={addRoyalty}>
        Add
      </button>



      <h2>List</h2>

      {royalties.map(r => (

        <div key={r.id}>

          {r.author} — {r.amount} — {r.date}

        </div>

      ))}


    </div>

  )

}
