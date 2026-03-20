import { NextResponse }  from "next/server"
import { prisma }        from "@/lib/db"
import { requireAuth }   from "@/lib/api-auth"
import { hashPassword }  from "@/lib/auth"
import { checkRateLimit } from "@/lib/rateLimit"
import { auditLog }      from "@/lib/audit"
import { validateEmail, validatePassword, validateRequired, validateEnum, sanitizeString } from "@/lib/validate"

const VALID_ROLES = ["admin", "manager", "accountant", "editor", "printer", "hr", "viewer"]

function getIp(req: Request): string {
  return (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || "unknown"
}

// ── GET /api/users ────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  try {
    const ip = getIp(req)
    if (!checkRateLimit(ip, "default")) {
      return NextResponse.json({ error: "Rate limit exceeded", code: "RATE_LIMIT" }, { status: 429 })
    }

    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    if (auth.role !== "admin") {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 })
    }

    const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } })

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
  } catch (err) {
    console.error("[GET /api/users]", err)
    return NextResponse.json({ error: "Internal server error", code: "SERVER_ERROR" }, { status: 500 })
  }
}

// ── POST /api/users ───────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const ip = getIp(req)
    if (!checkRateLimit(ip, "default")) {
      return NextResponse.json({ error: "Rate limit exceeded", code: "RATE_LIMIT" }, { status: 429 })
    }

    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    if (auth.role !== "admin") {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 })
    }

    const data = await req.json()

    // Validate
    const nameErr  = validateRequired(data.name, "name")
    if (nameErr) return NextResponse.json({ error: nameErr, code: "VALIDATION" }, { status: 400 })

    const emailErr = validateEmail(data.email)
    if (emailErr) return NextResponse.json({ error: emailErr, code: "VALIDATION" }, { status: 400 })

    const passErr  = validatePassword(data.password, 8)
    if (passErr) return NextResponse.json({ error: passErr, code: "VALIDATION" }, { status: 400 })

    if (data.role !== undefined) {
      const roleErr = validateEnum(data.role, VALID_ROLES, "role")
      if (roleErr) return NextResponse.json({ error: roleErr, code: "VALIDATION" }, { status: 400 })
    }

    const email = sanitizeString(data.email).toLowerCase()

    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) {
      return NextResponse.json({ error: "Email already in use", code: "CONFLICT" }, { status: 409 })
    }

    const hashed = await hashPassword(data.password)

    const user = await prisma.user.create({
      data: {
        email,
        name:     sanitizeString(data.name),
        password: hashed,
        role:     data.role ?? "viewer",
        active:   true,
      },
    })

    await auditLog({
      userId:   String(auth.id),
      action:   "USER_CREATE",
      entity:   "user",
      entityId: String(user.id),
      details:  `Created user ${user.email} with role ${user.role}`,
      ip,
    })

    return NextResponse.json({
      id:    user.id,
      name:  user.name,
      email: user.email,
      role:  user.role,
    }, { status: 201 })

  } catch (err) {
    console.error("[POST /api/users]", err)
    return NextResponse.json({ error: "Internal server error", code: "SERVER_ERROR" }, { status: 500 })
  }
}
