/**
 * NMI Business Data Seed
 * Run: npx tsx scripts/seed-business.ts
 * Safe: uses findFirst + create (no deletes). Idempotent.
 */
import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaNeon }   from "@prisma/adapter-neon"

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const prisma  = new PrismaClient({ adapter })

// ── helpers ───────────────────────────────────────────────────────────────────

function pad(n: number, len = 3) { return String(n).padStart(len, "0") }

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("── NMI Business Data Seed ──────────────────────────────────────")

  // ── 1. Companies ─────────────────────────────────────────────────────────────
  let printing = await prisma.company.findFirst({ where: { name: "NMI Printing" } })
  if (!printing) {
    printing = await prisma.company.create({ data: { name: "NMI Printing",   city: "Douala",   active: true } })
    console.log("✓ Created company: NMI Printing")
  } else { console.log("  Company NMI Printing already exists") }

  let publishing = await prisma.company.findFirst({ where: { name: "NMI Publishing" } })
  if (!publishing) {
    publishing = await prisma.company.create({ data: { name: "NMI Publishing", city: "Yaoundé",  active: true } })
    console.log("✓ Created company: NMI Publishing")
  } else { console.log("  Company NMI Publishing already exists") }

  // ── 2. Workers (5) ───────────────────────────────────────────────────────────
  const workersSpec = [
    { name: "Jean-Pierre Mballa", role: "Director",      department: "Management", contractType: "CDI", cnpsNumber: "12345678901", nationalId: "CM-123456789", phone: "+237 650 111 222", email: "jp.mballa@nmi.cm",  salaryBase: 450000, companyId: publishing.id, startDate: new Date("2019-03-01") },
    { name: "Marie Ngo",          role: "HR Manager",    department: "HR",         contractType: "CDI", cnpsNumber: "23456789012", nationalId: "CM-234567890", phone: "+237 650 222 333", email: "m.ngo@nmi.cm",      salaryBase: 320000, companyId: publishing.id, startDate: new Date("2020-06-15") },
    { name: "Paul Essomba",       role: "Sales Manager", department: "Sales",      contractType: "CDI", cnpsNumber: "34567890123", nationalId: "CM-345678901", phone: "+237 650 333 444", email: "p.essomba@nmi.cm",  salaryBase: 350000, companyId: printing.id,   startDate: new Date("2021-01-10") },
    { name: "Fatima Bello",       role: "Accountant",    department: "Finance",    contractType: "CDI", cnpsNumber: "45678901234", nationalId: "CM-456789012", phone: "+237 650 444 555", email: "f.bello@nmi.cm",    salaryBase: 300000, companyId: printing.id,   startDate: new Date("2021-09-01") },
    { name: "Emmanuel Talla",     role: "Senior Editor", department: "Editorial",  contractType: "CDI", cnpsNumber: "56789012345", nationalId: "CM-567890123", phone: "+237 650 555 666", email: "e.talla@nmi.cm",    salaryBase: 280000, companyId: publishing.id, startDate: new Date("2022-02-01") },
  ]

  const workers = []
  for (const w of workersSpec) {
    let rec = await prisma.worker.findFirst({ where: { email: w.email } })
    if (!rec) {
      rec = await prisma.worker.create({ data: { ...w, status: "active" } })
      console.log(`✓ Created worker: ${w.name}`)
    } else { console.log(`  Worker ${w.name} already exists`) }
    workers.push(rec)
  }

  // ── 3. Customers (3) ─────────────────────────────────────────────────────────
  const customersSpec = [
    { name: "Collège Bilingue de Yaoundé", phone: "+237 222 111 000", address: "Rue de l'École, Yaoundé",    type: "school",        region: "Centre",   status: "active", creditLimit: 2000000 },
    { name: "Librairie Saint-Paul Douala", phone: "+237 233 222 111", address: "Avenue de la Liberté, Douala", type: "distributor", region: "Littoral", status: "active", creditLimit: 5000000 },
    { name: "GICAM Schools Network",       phone: "+237 222 333 444", address: "Plateau Atémengué, Yaoundé", type: "institutional", region: "Centre",   status: "active", creditLimit: 10000000 },
  ]

  const customers = []
  for (const c of customersSpec) {
    let rec = await prisma.customer.findFirst({ where: { name: c.name } })
    if (!rec) {
      rec = await prisma.customer.create({ data: c })
      console.log(`✓ Created customer: ${c.name}`)
    } else { console.log(`  Customer ${c.name} already exists`) }
    customers.push(rec)
  }

  // ── 4. Authors (3) ───────────────────────────────────────────────────────────
  const authorsSpec = [
    { name: "Dr. Martin Fomba",      phone: "+237 677 100 200", email: "m.fomba@uy1.cm" },
    { name: "Prof. Alice Nkemdirim", phone: "+237 677 200 300", email: "a.nkemdirim@univ-dschang.cm" },
    { name: "Dr. Samuel Mbarga",     phone: "+237 677 300 400", email: "s.mbarga@nmi.cm" },
    { name: "Tabe John Tambe",       phone: "",                 email: "tabe.tambe@nmieducation.com" },
  ]

  const authors = []
  for (const a of authorsSpec) {
    let rec = await prisma.author.findFirst({ where: { name: a.name } })
    if (!rec) {
      rec = await prisma.author.create({ data: a })
      console.log(`✓ Created author: ${a.name}`)
    } else { console.log(`  Author ${a.name} already exists`) }
    authors.push(rec)
  }

  // ── 5. Update product stock (realistic levels, no delete) ────────────────────
  const stockUpdates = [
    { code: "P-FR-1",    stock: 850 }, { code: "P-FR-2",    stock: 720 },
    { code: "P-FR-3",    stock: 0   }, { code: "P-FR-5",    stock: 380 },
    { code: "P-FR-6",    stock: 160 }, { code: "P-ENG-1",   stock: 940 },
    { code: "P-ENG-3",   stock: 12  }, { code: "P-ENG-5",   stock: 310 },
    { code: "P-ENG-6",   stock: 75  }, { code: "P-MATH-2",  stock: 580 },
    { code: "P-MATH-4",  stock: 7   }, { code: "P-MATH-5",  stock: 420 },
    { code: "P-SCI-3",   stock: 0   }, { code: "P-SCI-5",   stock: 195 },
    { code: "P-SOC-4",   stock: 250 }, { code: "P-SOC-6",   stock: 90  },
    { code: "P-ICT-3-4", stock: 145 }, { code: "P-ICT-5-6", stock: 230 },
    { code: "P-HW-1",    stock: 320 }, { code: "P-HW-2",    stock: 280 },
  ]
  for (const u of stockUpdates) {
    await prisma.product.update({ where: { code: u.code }, data: { stock: u.stock } })
  }
  console.log("✓ Updated stock levels on 20 products")

  // ── 6. Orders (10) + line items + invoices ────────────────────────────────────
  type OrderSpec = {
    number: string; companyId: string; customerIdx: number; date: Date; status: string;
    items: { productCode: string; title: string; qty: number; price: number }[]
  }

  const ordersSpec: OrderSpec[] = [
    { number: "ORD-2025-001", companyId: printing.id,   customerIdx: 1, date: new Date("2025-01-15"), status: "delivered",
      items: [{ productCode: "P-FR-1",   title: "French, Class 1",                       qty: 200, price: 2500 },
              { productCode: "P-ENG-1",  title: "English, Class 1",                      qty: 150, price: 2500 }] },
    { number: "ORD-2025-002", companyId: publishing.id, customerIdx: 0, date: new Date("2025-02-03"), status: "delivered",
      items: [{ productCode: "P-MATH-2", title: "Mathematics, Class 2",                  qty: 120, price: 2500 },
              { productCode: "P-SCI-3",  title: "Sciences and Technology, Class 3",      qty:  80, price: 2500 }] },
    { number: "ORD-2025-003", companyId: printing.id,   customerIdx: 2, date: new Date("2025-02-20"), status: "delivered",
      items: [{ productCode: "P-ENG-3",  title: "English, Class 3",                      qty: 500, price: 2500 },
              { productCode: "P-FR-3",   title: "French, Class 3",                       qty: 500, price: 2500 }] },
    { number: "ORD-2025-004", companyId: publishing.id, customerIdx: 1, date: new Date("2025-03-10"), status: "shipped",
      items: [{ productCode: "P-SOC-4",  title: "Social Studies, Class 4",               qty: 300, price: 2500 },
              { productCode: "P-ICT-3-4",title: "ICT, Level 2 (Class 3 & 4)",            qty: 200, price: 2500 }] },
    { number: "ORD-2025-005", companyId: printing.id,   customerIdx: 0, date: new Date("2025-03-25"), status: "pending",
      items: [{ productCode: "P-HW-1",   title: "Handwriting, Class 1",                  qty: 100, price: 2500 },
              { productCode: "P-HW-2",   title: "Handwriting, Class 2",                  qty: 100, price: 2500 }] },
    { number: "ORD-2025-006", companyId: publishing.id, customerIdx: 2, date: new Date("2025-04-05"), status: "confirmed",
      items: [{ productCode: "P-MATH-4", title: "Mathematics, Class 4",                  qty: 450, price: 2500 },
              { productCode: "P-MATH-5", title: "Mathematics, Class 5",                  qty: 350, price: 2500 }] },
    { number: "ORD-2025-007", companyId: printing.id,   customerIdx: 1, date: new Date("2025-05-12"), status: "delivered",
      items: [{ productCode: "P-FR-5",   title: "French, Class 5",                       qty: 250, price: 2500 },
              { productCode: "P-ENG-5",  title: "English, Class 5",                      qty: 250, price: 2500 }] },
    { number: "ORD-2025-008", companyId: publishing.id, customerIdx: 0, date: new Date("2025-06-18"), status: "pending",
      items: [{ productCode: "P-SCI-5",  title: "Sciences and Technology, Class 5",      qty:  60, price: 2500 }] },
    { number: "ORD-2025-009", companyId: printing.id,   customerIdx: 2, date: new Date("2025-07-02"), status: "confirmed",
      items: [{ productCode: "P-ENG-6",  title: "English, Class 6",                      qty: 800, price: 2500 },
              { productCode: "P-FR-6",   title: "French, Class 6",                       qty: 600, price: 2500 }] },
    { number: "ORD-2025-010", companyId: publishing.id, customerIdx: 1, date: new Date("2025-08-14"), status: "pending",
      items: [{ productCode: "P-ICT-5-6",title: "ICT, Level 3 (Class 5 & 6)",            qty: 180, price: 2500 },
              { productCode: "P-SOC-6",  title: "Social Studies, Class 6",               qty: 120, price: 2500 }] },
  ]

  let invSeq = 1
  for (const od of ordersSpec) {
    const existing = await prisma.order.findUnique({ where: { number: od.number } })
    if (existing) { console.log(`  Order ${od.number} already exists`); invSeq++; continue }

    const customer  = customers[od.customerIdx]
    const lineItems = od.items.map(it => ({ ...it, lineTotal: it.qty * it.price }))
    const total     = lineItems.reduce((s, it) => s + it.lineTotal, 0)

    const order = await prisma.order.create({
      data: {
        number:       od.number,
        companyId:    od.companyId,
        customerId:   customer.id,
        customerName: customer.name,
        date:         od.date,
        status:       od.status,
        total,
        items: { create: lineItems },
      },
    })

    // Invoice for all orders
    const dueDate    = new Date(od.date)
    dueDate.setDate(dueDate.getDate() + 30)
    const isPaid     = od.status === "delivered"
    const isPartial  = od.status === "shipped"
    const paidAmount = isPaid ? total : isPartial ? Math.round(total * 0.5) : 0
    const invStatus  = isPaid ? "paid" : isPartial ? "partial" : "issued"

    await prisma.invoice.create({
      data: {
        number:       `INV-2025-${pad(invSeq)}`,
        orderId:      order.id,
        companyId:    od.companyId,
        customerName: customer.name,
        amount:       total,
        paid:         paidAmount,
        status:       invStatus,
        dueDate,
      },
    })

    console.log(`✓ Order ${od.number} (${od.status}) — ${total.toLocaleString()} XAF | Invoice ${invStatus}`)
    invSeq++
  }

  // ── 7. Manuscripts (5) ───────────────────────────────────────────────────────
  const manuscriptsSpec = [
    {
      title: "Mathematics for Primary — Complete Series Revision",
      author: "Dr. Martin Fomba", subject: "Mathematics", level: "Primary", class: "All Classes",
      status: "approved", approved: true, readyForPrint: true, version: 3,
      editor: "Emmanuel Talla", suggestedCode: "P-MATH-REV",
      notes: "Full revision of the 6-book maths series aligned with 2025 curriculum reforms.",
      editorNotes: "Final proofread complete. Cleared for print.",
      date: new Date("2024-11-15"),
    },
    {
      title: "English Communication Skills Class 3 — Revised Edition",
      author: "Prof. Alice Nkemdirim", subject: "English", level: "Primary", class: "Primary 3",
      status: "reviewing", approved: false, readyForPrint: false, version: 2,
      editor: "Emmanuel Talla", suggestedCode: "P-ENG-3-REV",
      notes: "Improved listening comprehension and oral communication sections.",
      editorNotes: "Checking glossary consistency and exercise numbering.",
      date: new Date("2025-01-20"),
    },
    {
      title: "Sciences & Technology Activity Book — Class 4",
      author: "Dr. Samuel Mbarga", subject: "Sciences and Technology", level: "Primary", class: "Primary 4",
      status: "editing", approved: false, readyForPrint: false, version: 1,
      editor: "Emmanuel Talla", suggestedCode: "P-SCI-4-ACT",
      notes: "Hands-on activity supplement with 40 practicals and safety checklists.",
      editorNotes: "Standardising experiment instructions. Diagrams need redraw.",
      date: new Date("2025-02-28"),
    },
    {
      title: "Social Studies — Cameroon Heritage Edition Class 5",
      author: "Jean Fotso", subject: "Social Studies", level: "Primary", class: "Primary 5",
      status: "submitted", approved: false, readyForPrint: false, version: 1,
      editor: "", suggestedCode: "P-SOC-5-CH",
      notes: "New title covering Cameroonian history, cultural diversity and civic education.",
      editorNotes: "",
      date: new Date("2025-03-10"),
    },
    {
      title: "ICT for Kids — Level 2 Interactive Workbook",
      author: "Paul Kamga", subject: "ICT", level: "Primary", class: "Primary 3-4",
      status: "approved", approved: true, readyForPrint: true, version: 2,
      editor: "Emmanuel Talla", suggestedCode: "P-ICT-L2-WB",
      notes: "Workbook with QR codes linking to video tutorials and online exercises.",
      editorNotes: "Layout approved. Pending final QR code verification.",
      date: new Date("2025-04-25"),
    },
  ]

  for (const m of manuscriptsSpec) {
    const exists = await prisma.manuscript.findFirst({ where: { title: m.title } })
    if (!exists) {
      await prisma.manuscript.create({ data: m })
      console.log(`✓ Created manuscript: ${m.title}`)
    } else { console.log(`  Manuscript "${m.title}" already exists`) }
  }

  // ── 8. Royalties ─────────────────────────────────────────────────────────────
  const royaltiesSpec = [
    { author: "Dr. Martin Fomba",      book: "Mathematics, Class 1",                           amount:  62500, date: new Date("2025-01-31"), status: "paid"   },
    { author: "Dr. Martin Fomba",      book: "Mathematics, Class 2",                           amount:  43750, date: new Date("2025-02-28"), status: "paid"   },
    { author: "Dr. Martin Fomba",      book: "Mathematics for Primary — Complete Series Revision", amount: 125000, date: new Date("2025-09-30"), status: "unpaid" },
    { author: "Prof. Alice Nkemdirim", book: "English, Class 3",                               amount:  78125, date: new Date("2025-02-28"), status: "paid"   },
    { author: "Prof. Alice Nkemdirim", book: "English, Class 5",                               amount:  62500, date: new Date("2025-05-31"), status: "unpaid" },
    { author: "Dr. Samuel Mbarga",     book: "Sciences and Technology, Class 3",               amount:  25000, date: new Date("2025-02-28"), status: "paid"   },
    { author: "Dr. Samuel Mbarga",     book: "Sciences & Technology Activity Book — Class 4",  amount:  45000, date: new Date("2025-10-31"), status: "unpaid" },
    { author: "Tabe John Tambe",       book: "Handwriting Class 1, Handwriting Class 2, English Class 1, English Class 2", amount: 150000, date: new Date("2025-08-31"), status: "unpaid" },
  ]

  for (const r of royaltiesSpec) {
    const exists = await prisma.royalty.findFirst({ where: { author: r.author, book: r.book } })
    if (!exists) {
      await prisma.royalty.create({ data: r })
      console.log(`✓ Created royalty: ${r.author} — ${r.book} (${r.status})`)
    } else { console.log(`  Royalty ${r.author}/${r.book} already exists`) }
  }

  // ── 9. Printing jobs (2) ─────────────────────────────────────────────────────
  const printJobsSpec = [
    { book: "Mathematics for Primary — Complete Series Revision", quantity: 5000, cost: 3750000, printer: "ImprimCam Douala",    date: new Date("2025-07-01"), status: "printing" },
    { book: "English Class 6 — 2025 Reprint",                    quantity: 8000, cost: 5200000, printer: "PrintMaster Yaoundé", date: new Date("2025-06-10"), status: "printed"  },
  ]

  for (const pj of printJobsSpec) {
    const exists = await prisma.printingJob.findFirst({ where: { book: pj.book } })
    if (!exists) {
      await prisma.printingJob.create({ data: pj })
      console.log(`✓ Created print job: ${pj.book} (${pj.status})`)
    } else { console.log(`  Print job "${pj.book}" already exists`) }
  }

  // ── 10. Cost records ─────────────────────────────────────────────────────────
  const costsSpec = [
    { book: "Mathematics for Primary — Complete Series Revision", type: "printing",      amount: 3750000, date: new Date("2025-07-01"), notes: "Print run 5,000 copies — ImprimCam Douala" },
    { book: "English Class 6 — 2025 Reprint",                    type: "printing",      amount: 5200000, date: new Date("2025-06-10"), notes: "Reprint run 8,000 copies — PrintMaster Yaoundé" },
    { book: "",                                                   type: "distribution",  amount:  450000, date: new Date("2025-03-10"), notes: "Delivery fleet hire — March 2025 distribution run" },
    { book: "",                                                   type: "admin",         amount:  180000, date: new Date("2025-01-05"), notes: "Annual ISBN registration fees — 2025" },
    { book: "",                                                   type: "admin",         amount:   75000, date: new Date("2025-02-01"), notes: "Legal fees — author contract renewals Q1 2025" },
  ]

  for (const c of costsSpec) {
    const exists = await prisma.costRecord.findFirst({ where: { notes: c.notes } })
    if (!exists) {
      await prisma.costRecord.create({ data: c })
    }
  }
  console.log("✓ Created cost records")

  // ── 11. Performance records ───────────────────────────────────────────────────
  const perfSpec = [
    { workerIdx: 0, period: "Q1-2025", attendance: 9.5, productivity: 9.0, quality: 9.2, teamwork: 8.8, discipline: 9.5 },
    { workerIdx: 1, period: "Q1-2025", attendance: 9.0, productivity: 8.5, quality: 8.8, teamwork: 9.2, discipline: 9.0 },
    { workerIdx: 2, period: "Q1-2025", attendance: 8.5, productivity: 9.2, quality: 8.5, teamwork: 8.5, discipline: 8.8 },
    { workerIdx: 3, period: "Q1-2025", attendance: 9.8, productivity: 8.8, quality: 9.5, teamwork: 9.0, discipline: 9.8 },
    { workerIdx: 4, period: "Q1-2025", attendance: 7.5, productivity: 7.0, quality: 7.8, teamwork: 8.0, discipline: 7.5 },
  ]

  for (const p of perfSpec) {
    const worker = workers[p.workerIdx]
    const exists = await prisma.performanceRecord.findFirst({ where: { workerId: worker.id, period: p.period } })
    if (exists) { console.log(`  Perf record ${worker.name}/${p.period} already exists`); continue }

    const totalScore   = p.attendance + p.productivity + p.quality + p.teamwork + p.discipline
    const scorePercent = (totalScore / 50) * 100
    const rating       = scorePercent >= 90 ? "Excellent"    : scorePercent >= 75 ? "Good"   : scorePercent >= 60 ? "Satisfactory" : "Needs Improvement"
    const recommendation = scorePercent >= 90 ? "Promotion eligible" : scorePercent >= 75 ? "On track — annual increment" : scorePercent >= 60 ? "Continue monitoring" : "Performance improvement plan required"
    const baseSalary   = Number(worker.salaryBase)
    const bonusPercent = scorePercent >= 90 ? 15 : scorePercent >= 75 ? 10 : scorePercent >= 60 ? 5 : 0
    const bonusAmount  = baseSalary * (bonusPercent / 100)

    await prisma.performanceRecord.create({
      data: {
        workerId: worker.id, period: p.period,
        attendance: p.attendance, productivity: p.productivity, quality: p.quality,
        teamwork: p.teamwork, discipline: p.discipline,
        totalScore, scorePercent, rating, recommendation,
        baseSalary, bonusPercent, bonusAmount,
        bonusScore:     totalScore * (bonusPercent / 100),
        managerNote:    `Q1 2025 evaluation — rated ${rating}`,
        aiSummary:      `${worker.name} scored ${scorePercent.toFixed(1)}% in Q1 2025. ${recommendation}.`,
        aiBonusSummary: bonusPercent > 0 ? `Eligible for ${bonusPercent}% bonus = ${bonusAmount.toLocaleString()} XAF` : "No bonus this period.",
        suggestedSalary: baseSalary * (bonusPercent >= 10 ? 1.05 : 1),
        salaryIncrease:  bonusPercent >= 10 ? baseSalary * 0.05 : 0,
      },
    })
    console.log(`✓ Created perf record: ${worker.name} — ${scorePercent.toFixed(1)}% (${rating})`)
  }

  console.log("\n✓ Seed complete — all NMI business data loaded\n")
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
