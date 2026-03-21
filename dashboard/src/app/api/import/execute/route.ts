import { NextRequest, NextResponse } from "next/server"
import { requireAuth }               from "@/lib/api-auth"
import { parseBuffer, applyMapping, MODULE_FIELDS } from "@/lib/importParser"
import { prisma }                    from "@/lib/db"
import { Prisma }                    from "@prisma/client"
const Decimal = Prisma.Decimal

export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  const formData     = await req.formData()
  const file         = formData.get("file") as File | null
  const module       = formData.get("module") as string | null
  const mappingRaw   = formData.get("mapping") as string | null

  if (!file || !module || !mappingRaw) {
    return NextResponse.json({ error: "file, module, and mapping required" }, { status: 400 })
  }

  const mapping = JSON.parse(mappingRaw) as Record<string, string>
  const fields  = MODULE_FIELDS[module]
  if (!fields) return NextResponse.json({ error: `Unknown module: ${module}` }, { status: 400 })

  const buf          = Buffer.from(await file.arrayBuffer())
  const { rows }     = parseBuffer(buf, file.name)
  const mapped       = applyMapping(rows, mapping)

  let imported = 0
  let skipped  = 0
  const errors: string[] = []

  for (let i = 0; i < mapped.length; i++) {
    const row = mapped[i]
    const rowNum = i + 2 // 1-indexed + header row

    // Check required fields
    const missing = fields.required.filter(f => !row[f]?.trim())
    if (missing.length) {
      skipped++
      errors.push(`Row ${rowNum}: missing ${missing.join(", ")}`)
      continue
    }

    try {
      await insertRow(module, row)
      imported++
    } catch (err) {
      skipped++
      errors.push(`Row ${rowNum}: ${err instanceof Error ? err.message : "insert failed"}`)
    }
  }

  // Log import
  await prisma.importLog.create({
    data: {
      module,
      source:     file.name,
      totalRows:  rows.length,
      imported,
      skipped,
      errors:     errors.length ? errors.slice(0, 50).join("\n") : null,
      importedBy: auth.name,
      companyId:  auth.companyId ?? null,
    },
  })

  return NextResponse.json({ total: rows.length, imported, skipped, errors: errors.slice(0, 20) })
}

async function insertRow(module: string, row: Record<string, string>): Promise<void> {
  switch (module) {
    case "workers":
      await prisma.worker.create({ data: {
        name:         row.name,
        role:         row.role ?? "staff",
        department:   row.department ?? "",
        contractType: row.contractType ?? "CDI",
        salaryBase:   row.salaryBase ? new Decimal(row.salaryBase.replace(/[^\d.]/g, "")) : new Decimal(0),
        cnpsNumber:   row.cnpsNumber ?? null,
        phone:        row.phone ?? null,
        email:        row.email ?? null,
      }})
      break

    case "products":
      await prisma.product.upsert({
        where:  { code: row.code },
        update: { title: row.title, price: row.price ? new Decimal(row.price.replace(/[^\d.]/g, "")) : new Decimal(0) },
        create: {
          code:    row.code,
          title:   row.title,
          subject: row.subject ?? "",
          level:   row.level ?? "Primary",
          class:   row.class ?? "",
          price:   row.price ? new Decimal(row.price.replace(/[^\d.]/g, "")) : new Decimal(0),
          stock:   row.stock ? parseInt(row.stock) : 0,
        },
      })
      break

    case "customers":
      await prisma.customer.create({ data: {
        name:    row.name,
        phone:   row.phone ?? "",
        address: row.address ?? "",
        region:  row.region ?? "",
        type:    row.type ?? "individual",
      }})
      break

    case "authors":
      await prisma.author.create({ data: {
        name:  row.name,
        email: row.email ?? "",
        phone: row.phone ?? "",
      }})
      break

    case "distributors":
      await prisma.distributor.create({ data: {
        name:    row.name,
        region:  row.region,
        city:    row.city ?? "",
        phone:   row.phone ?? null,
        email:   row.email ?? null,
        address: row.address ?? null,
      }})
      break

    case "royalties":
      await prisma.royalty.create({ data: {
        author: row.author ?? "",
        book:   row.book ?? "",
        amount: row.amount ? new Decimal(row.amount.replace(/[^\d.]/g, "")) : new Decimal(0),
        status: row.status ?? "unpaid",
      }})
      break

    default:
      throw new Error(`Module ${module} insert not implemented`)
  }
}
