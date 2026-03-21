import * as XLSX from "xlsx"

export interface ParsedSheet {
  headers: string[]
  rows:    Record<string, string>[]
}

export const MODULE_FIELDS: Record<string, { required: string[]; all: string[] }> = {
  workers:      { required: ["name", "role"], all: ["name", "role", "department", "contractType", "salaryBase", "cnpsNumber", "phone", "email"] },
  products:     { required: ["code", "title"], all: ["code", "title", "subject", "level", "class", "price", "stock"] },
  customers:    { required: ["name"], all: ["name", "phone", "address", "region", "type"] },
  authors:      { required: ["name"], all: ["name", "email", "phone"] },
  royalties:    { required: ["author", "book", "amount"], all: ["author", "book", "amount", "date", "status"] },
  orders:       { required: ["customerName", "productCode", "quantity"], all: ["customerName", "productCode", "quantity", "date", "status"] },
  distributors: { required: ["name", "region"], all: ["name", "region", "city", "phone", "email", "address"] },
}

export function parseBuffer(buffer: Buffer, filename = ""): ParsedSheet {
  const isCSV = filename.toLowerCase().endsWith(".csv")
  const wb    = XLSX.read(buffer, { type: "buffer", cellDates: true })
  const ws    = wb.Sheets[wb.SheetNames[0]]
  const rows  = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: "" })

  if (!rows.length) return { headers: [], rows: [] }

  const headers = Object.keys(rows[0])
  void isCSV
  return { headers, rows }
}

export function applyMapping(
  rows: Record<string, string>[],
  mapping: Record<string, string>, // { sourceCol → nmiField }
): Record<string, string>[] {
  return rows.map(row => {
    const mapped: Record<string, string> = {}
    for (const [src, dest] of Object.entries(mapping)) {
      if (dest && dest !== "__skip__") mapped[dest] = String(row[src] ?? "")
    }
    return mapped
  })
}

export function buildCSVTemplate(module: string): string {
  const fields = MODULE_FIELDS[module]?.all ?? []
  const example: Record<string, string> = {
    name:         "Example Name",
    role:         "staff",
    department:   "Sales",
    contractType: "CDI",
    salaryBase:   "150000",
    cnpsNumber:   "123456",
    phone:        "+237 6xx xxx xxx",
    email:        "email@example.com",
    code:         "NMI-001",
    title:        "Book Title",
    subject:      "Mathematics",
    level:        "Primary",
    class:        "CM1",
    price:        "2500",
    stock:        "100",
    isbn:         "978-xxxxxxxxxx",
    address:      "Yaoundé Centre",
    region:       "Centre",
    type:         "bookshop",
    nationality:  "Cameroonian",
    bio:          "Author biography",
    authorName:   "Author Name",
    bookTitle:    "Book Title",
    amount:       "500000",
    period:       "2025-Q1",
    paid:         "false",
    customerName: "Customer Name",
    productCode:  "NMI-001",
    quantity:     "10",
    date:         "2025-01-15",
    status:       "pending",
    city:         "Yaoundé",
  }
  const headers  = fields.join(",")
  const exampleRow = fields.map(f => example[f] ?? "").join(",")
  return `${headers}\n${exampleRow}\n`
}
