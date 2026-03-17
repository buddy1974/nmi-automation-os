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
  suggestedLevel: string
  suggestedClass: string
  suggestedSubject: string
  suggestedCode: string
}

function classifySubject(subject: string): { name: string; code: string } {
  const s = subject.toLowerCase()
  if (s.includes("english"))  return { name: "English",                  code: "ENG"  }
  if (s.includes("math"))     return { name: "Mathematics",              code: "MATH" }
  if (s.includes("science"))  return { name: "Sciences and Technology",  code: "SCI"  }
  if (s.includes("french"))   return { name: "French",                   code: "FR"   }
  if (s.includes("social"))   return { name: "Social Studies",           code: "SOC"  }
  if (s.includes("ict"))      return { name: "ICT",                      code: "ICT"  }
  if (s.includes("handwrit")) return { name: "Handwriting",              code: "HW"   }
  return { name: subject, code: "GEN" }
}

function classifyClass(cls: string): string {
  if (cls.includes("1")) return "Primary 1"
  if (cls.includes("2")) return "Primary 2"
  if (cls.includes("3")) return "Primary 3"
  if (cls.includes("4")) return "Primary 4"
  if (cls.includes("5")) return "Primary 5"
  if (cls.includes("6")) return "Primary 6"
  return cls
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

      readyForPrint: false,

      suggestedLevel: "",
      suggestedClass: "",
      suggestedSubject: "",
      suggestedCode: ""

    }

    setManuscripts([...manuscripts, newManuscript])

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

        const { name: suggestedSubject, code: subjectCode } = classifySubject(m.subject)

        const suggestedClass = classifyClass(m.class)

        const classNo = suggestedClass.replace("Primary ", "")

        const suggestedCode = `P-${subjectCode}-${classNo}`

        const suggestedLevel = "Primary"

        const report =
          "Level: Primary\n" +
          "Quality: Good\n" +
          "Grammar: OK\n" +
          "Subject detected: " + suggestedSubject + "\n" +
          "Suggested class: " + suggestedClass

        return {
          ...m,
          aiReport: report,
          status: "reviewing" as ManuscriptStatus,
          suggestedLevel,
          suggestedClass,
          suggestedSubject,
          suggestedCode
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

          {m.suggestedCode && (
            <div>
              Suggested Level: {m.suggestedLevel}<br />
              Suggested Class: {m.suggestedClass}<br />
              Suggested Subject: {m.suggestedSubject}<br />
              Suggested Code: {m.suggestedCode}
            </div>
          )}

        </div>

      ))}


    </div>

  )

}
