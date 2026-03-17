"use client"

import { useState } from "react"

type Author = {
  id: number
  name: string
  phone: string
  email: string
}

export default function AuthorsPage() {

  const [authors, setAuthors] = useState<Author[]>([])

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")


  function addAuthor() {

    if (!name) return

    const newAuthor: Author = {

      id: Date.now(),

      name,
      phone,
      email

    }

    setAuthors([...authors, newAuthor])

    setName("")
    setPhone("")
    setEmail("")

  }


  return (

    <div>

      <h1>Authors</h1>


      <h2>Add author</h2>

      <input
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        placeholder="Phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <button onClick={addAuthor}>
        Add
      </button>



      <h2>List</h2>

      {authors.map(a => (

        <div key={a.id}>

          {a.name} — {a.phone} — {a.email}

        </div>

      ))}


    </div>

  )

}
