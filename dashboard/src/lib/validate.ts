// Simple validation helpers — no external deps

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(email: unknown): string | null {
  if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    return "Invalid email format"
  }
  return null
}

export function validatePassword(password: unknown, minLength = 6): string | null {
  if (typeof password !== "string" || password.length < minLength) {
    return `Password must be at least ${minLength} characters`
  }
  return null
}

export function validateRequired(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === "") {
    return `${field} is required`
  }
  return null
}

export function validatePositiveNumber(value: unknown, field: string): string | null {
  const n = Number(value)
  if (isNaN(n) || n <= 0) return `${field} must be a positive number`
  return null
}

export function validateEnum(value: unknown, allowed: string[], field: string): string | null {
  if (typeof value !== "string" || !allowed.includes(value)) {
    return `${field} must be one of: ${allowed.join(", ")}`
  }
  return null
}

/** Strip leading/trailing whitespace and remove < > to prevent XSS injection in string fields. */
export function sanitizeString(s: unknown): string {
  if (typeof s !== "string") return ""
  return s.trim().replace(/[<>]/g, "")
}
