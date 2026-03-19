// ── Performance scoring utilities ─────────────────────────────────────────────
// Shared between actions.ts (server action) and ai-actions.ts (automation).

export const MAX_SCORE = 500

export interface RatingResult {
  rating:         string
  bonus:          number
  recommendation: string
}

export function computeRating(score: number): RatingResult {
  if (score >= 450) return { rating: "Outstanding",       bonus: 100, recommendation: "Promotion track" }
  if (score >= 400) return { rating: "Excellent",         bonus: 80,  recommendation: "Bonus recommended" }
  if (score >= 350) return { rating: "Very Good",         bonus: 60,  recommendation: "Stable" }
  if (score >= 300) return { rating: "Good",              bonus: 40,  recommendation: "Monitor" }
  if (score >= 250) return { rating: "Needs Improvement", bonus: 10,  recommendation: "Coaching needed" }
  return                   { rating: "Critical",          bonus: 0,   recommendation: "Warning" }
}
