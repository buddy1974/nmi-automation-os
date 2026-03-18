import { NextResponse }  from "next/server"
import { prisma }        from "@/lib/db"
import { requireAuth }   from "@/lib/api-auth"
import { hashPassword }  from "@/lib/auth"

const VALID_ROLES = ["admin", "manager", "accountant", "editor", "printer", "hr", "viewer"]

// ── GET /api/users ────────────────────────────────────────────────────────────

export async function GET() {

  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  if (auth.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(
    users.map(u => ({
      id:        u.id,
      name:      u.name,
      email:     u.email,
      role:      u.role,
      active:    u.active,
      createdAt: u.createdAt,
    }))
  )
}

// ── POST /api/users ───────────────────────────────────────────────────────────

export async function POST(req: Request) {

  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  if (auth.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const data = await req.json()

  if (!data.email || !data.password) {
    return NextResponse.json({ error: "email and password are required" }, { status: 400 })
  }
  if (!data.name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 })
  }
  if (data.password.length < 6) {
    return NextResponse.json({ error: "password must be at least 6 characters" }, { status: 400 })
  }
  if (data.role && !VALID_ROLES.includes(data.role)) {
    return NextResponse.json({ error: `role must be one of: ${VALID_ROLES.join(", ")}` }, { status: 400 })
  }

  const exists = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } })
  if (exists) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 })
  }

  const hashed = await hashPassword(data.password)

  const user = await prisma.user.create({
    data: {
      email:    data.email.toLowerCase(),
      name:     data.name,
      password: hashed,
      role:     data.role ?? "viewer",
      active:   true,
    },
  })

  return NextResponse.json({
    id:    user.id,
    name:  user.name,
    email: user.email,
    role:  user.role,
  }, { status: 201 })
}
