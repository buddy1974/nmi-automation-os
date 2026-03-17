"use client"

import { useState } from "react"

type ManuscriptStatus =
  | "submitted"
  | "reviewing"
  | "editing"
  | "approved"
  | "rejected"
  | "ready_for_print"
  | "printing"

type HistoryItem = {
  version: number
  date: string
  editor: string
  notes: string
}

type BookData = {
  code: string
  title: string
  author: string
  subject: string
  level: string
  class: string
  royaltyType: "percent" | "fixed"
  royaltyValue: number
  price: number
}

type PrintData = {
  pages: number
  format: string
  coverReady: boolean
  printQuantity: number
  printer: string
  cost: number
  printReady: boolean
}

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
  history: HistoryItem[]
  aiReport: string
  aiEditReport: string
  editor: string
  editorNotes: string
  approved: boolean
  readyForPrint: boolean
  suggestedLevel: string
  suggestedClass: string
  suggestedSubject: string
  suggestedCode: string
  fileName: string
  fileSize: number
  fileDate: string
  bookData: BookData | null
  printData: PrintData | null
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

  const [title, setTitle]       = useState("")
  const [author, setAuthor]     = useState("")
  const [subject, setSubject]   = useState("")
  const [level]                 = useState("Primary")
  const [className, setClassName] = useState("")
  const [notes, setNotes]       = useState("")


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
      history: [],
      aiReport: "",
      aiEditReport: "",
      editor: "",
      editorNotes: "",
      approved: false,
      readyForPrint: false,
      suggestedLevel: "",
      suggestedClass: "",
      suggestedSubject: "",
      suggestedCode: "",
      fileName: "",
      fileSize: 0,
      fileDate: "",
      bookData: null,
      printData: null
    }

    setManuscripts([...manuscripts, newManuscript])
    setTitle("")
    setAuthor("")
    setSubject("")
    setClassName("")
    setNotes("")

  }


  function update(id: number, patch: Partial<Manuscript>) {
    setManuscripts(manuscripts.map(m => m.id === id ? { ...m, ...patch } : m))
  }


  // Phase 8.3 — AI analysis

  function analyse(id: number) {

    setManuscripts(manuscripts.map(m => {

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

    }))

  }


  // Phase 8.5 — Status transitions

  function setStatus(id: number, status: ManuscriptStatus) {
    setManuscripts(manuscripts.map(m =>
      m.id === id
        ? {
            ...m,
            status,
            approved: status === "approved",
            readyForPrint: status === "ready_for_print"
          }
        : m
    ))
  }


  // Phase 8.6 — Version control

  function saveVersion(id: number) {

    setManuscripts(manuscripts.map(m => {

      if (m.id !== id) return m

      const newVersion = m.version + 1

      const entry: HistoryItem = {
        version: newVersion,
        date: new Date().toLocaleDateString(),
        editor: m.editor,
        notes: m.editorNotes
      }

      return {
        ...m,
        version: newVersion,
        history: [...m.history, entry]
      }

    }))

  }


  // Phase 8.7 — Create book data

  function createBook(id: number) {

    setManuscripts(manuscripts.map(m => {

      if (m.id !== id) return m

      const bookData: BookData = {
        code: m.suggestedCode || `P-GEN-0`,
        title: m.title,
        author: m.author,
        subject: m.suggestedSubject || m.subject,
        level: m.suggestedLevel || m.level,
        class: m.suggestedClass || m.class,
        royaltyType: "percent",
        royaltyValue: 10,
        price: 2500
      }

      return { ...m, bookData }

    }))

  }


  // Phase 8.8 — AI editor assist

  function aiEdit(id: number) {

    setManuscripts(manuscripts.map(m => {

      if (m.id !== id) return m

      const report =
        "Grammar issues: None detected\n" +
        "Difficulty level: Age-appropriate\n" +
        "Missing exercises: Add 2 practice sections\n" +
        "Format errors: Check heading hierarchy\n" +
        "Page estimate: ~80 pages"

      return { ...m, aiEditReport: report }

    }))

  }


  // Phase 8.9 — Print preparation

  function preparePrint(id: number) {

    setManuscripts(manuscripts.map(m => {

      if (m.id !== id) return m

      const printData: PrintData = {
        pages: 80,
        format: "A4",
        coverReady: false,
        printQuantity: 500,
        printer: "",
        cost: 0,
        printReady: false
      }

      return {
        ...m,
        printData,
        status: "ready_for_print",
        readyForPrint: true
      }

    }))

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
          <b>{m.status}</b> —
          v{m.version}


          {/* Status buttons */}
          <div>
            <button onClick={() => analyse(m.id)}>Analyse AI</button>
            <button onClick={() => setStatus(m.id, "reviewing")}>Review</button>
            <button onClick={() => setStatus(m.id, "editing")}>Edit</button>
            <button onClick={() => setStatus(m.id, "approved")}>Approve</button>
            <button onClick={() => setStatus(m.id, "rejected")}>Reject</button>
            <button onClick={() => setStatus(m.id, "ready_for_print")}>Ready for Print</button>
          </div>


          {/* Editor workflow */}
          <div>
            <input
              placeholder="Assign editor"
              value={m.editor}
              onChange={(e) => update(m.id, { editor: e.target.value })}
            />
            <input
              placeholder="Editor notes"
              value={m.editorNotes}
              onChange={(e) => update(m.id, { editorNotes: e.target.value })}
            />
            <button onClick={() => saveVersion(m.id)}>
              Save Version
            </button>
          </div>


          {/* AI reports */}
          {m.aiReport && <pre>{m.aiReport}</pre>}

          <button onClick={() => aiEdit(m.id)}>AI Editor Assist</button>
          {m.aiEditReport && <pre>{m.aiEditReport}</pre>}


          {/* Classification */}
          {m.suggestedCode && (
            <div>
              Suggested Level: {m.suggestedLevel}<br />
              Suggested Class: {m.suggestedClass}<br />
              Suggested Subject: {m.suggestedSubject}<br />
              Suggested Code: {m.suggestedCode}
            </div>
          )}


          {/* Create book */}
          {m.approved && !m.bookData && (
            <button onClick={() => createBook(m.id)}>
              Create Book
            </button>
          )}

          {m.bookData && (
            <div>
              <b>Book ready:</b>{" "}
              {m.bookData.code} — {m.bookData.title} —
              {m.bookData.author} — {m.bookData.royaltyType}/{m.bookData.royaltyValue}%
            </div>
          )}


          {/* Print preparation */}
          {m.approved && !m.printData && (
            <button onClick={() => preparePrint(m.id)}>
              Prepare Print
            </button>
          )}

          {m.printData && (
            <div>
              <b>Print data:</b>{" "}
              {m.printData.pages}p — {m.printData.format} —
              qty: {m.printData.printQuantity}
              <input
                placeholder="Printer"
                value={m.printData.printer}
                onChange={(e) =>
                  update(m.id, {
                    printData: { ...m.printData!, printer: e.target.value }
                  })
                }
              />
            </div>
          )}


          {/* Version history */}
          {m.history.length > 0 && (
            <div>
              <b>History:</b>
              {m.history.map((h, i) => (
                <div key={i}>
                  v{h.version} — {h.date} — {h.editor} — {h.notes}
                </div>
              ))}
            </div>
          )}

        </div>

      ))}

    </div>

  )

}
