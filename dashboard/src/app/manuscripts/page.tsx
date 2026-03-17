"use client"

import { useState } from "react"

type ManuscriptStatus =
  | "submitted"
  | "reviewing"
  | "editing"
  | "approved"
  | "rejected"
  | "ready_for_print"

type Manuscript = {
  id: number
  title: string
  author: string
  subject: string
  level: string
  class: string
  status: ManuscriptStatus
  notes: string
  date: string
  version: number
  aiReport: string
  approved: boolean
  readyForPrint: boolean
}

export default function ManuscriptsPage() {

  const [manuscripts, setManuscripts] = useState<Manuscript[]>([])

  const [title, setTitle] = useState("")
  const [author, setAuthor] = useState("")
  const [subject, setSubject] = useState("")
  const [level, setLevel] = useState("Primary")
  const [className, setClassName] = useState("")
  const [notes, setNotes] = useState("")


  function addManuscript() {

    if (!title) return

    const newManuscript: Manuscript = {

      id: Date.now(),

      title,
      author,
      subject,
      level,
      class: className,

      status: "submitted",

      notes,

      date: new Date().toLocaleDateString(),

      version: 1,

      aiReport: "",

      approved: false,

      readyForPrint: false

    }

    setManuscripts([
      ...manuscripts,
      newManuscript
    ])

    setTitle("")
    setAuthor("")
    setSubject("")
    setClassName("")
    setNotes("")

  }



  function analyse(id: number) {

    setManuscripts(

      manuscripts.map(m => {

        if (m.id !== id) return m

        const report =
          "Level: Primary\n" +
          "Quality: Good\n" +
          "Grammar: OK\n" +
          "Subject detected: " + m.subject + "\n" +
          "Suggested class: " + m.class

        return {
          ...m,
          aiReport: report,
          status: "reviewing" as ManuscriptStatus
        }

      })

    )

  }



  return (

    <div>

      <h1>Manuscripts</h1>


      <h2>Add manuscript</h2>

      <input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <input
        placeholder="Author"
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
      />

      <input
        placeholder="Subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
      />

      <input
        placeholder="Class"
        value={className}
        onChange={(e) => setClassName(e.target.value)}
      />

      <input
        placeholder="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <button onClick={addManuscript}>
        Add
      </button>


      <h2>List</h2>

      {manuscripts.map(m => (

        <div key={m.id}>

          <b>{m.title}</b> —
          {m.author} —
          {m.subject} —
          {m.class} —
          {m.status}

          <button onClick={() => analyse(m.id)}>
            Analyse AI
          </button>

          <pre>{m.aiReport}</pre>

        </div>

      ))}


    </div>

  )

}
