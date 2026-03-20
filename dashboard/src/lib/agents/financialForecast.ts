import { prisma }  from "@/lib/db"
import Anthropic   from "@anthropic-ai/sdk"
import type { AgentResult } from "./index"

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

export async function runFinancialForecast(companyId?: string): Promise<AgentResult> {
  // Fetch last 6 months of orders
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  sixMonthsAgo.setDate(1)
  sixMonthsAgo.setHours(0, 0, 0, 0)

  const orders = await prisma.order.findMany({
    where:  { date: { gte: sixMonthsAgo }, ...(companyId ? { companyId } : {}) },
    select: { date: true, total: true },
  })

  // Group by month
  const monthMap = new Map<string, number>()
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2,"0")}`
    monthMap.set(key, 0)
  }
  for (const o of orders) {
    const d   = new Date(o.date)
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2,"0")}`
    if (monthMap.has(key)) monthMap.set(key, (monthMap.get(key) ?? 0) + Number(o.total))
  }

  const monthly = [...monthMap.entries()].map(([key, amount]) => {
    const [year, monthIdx] = key.split("-").map(Number)
    return { label: `${MONTH_NAMES[monthIdx]} ${String(year).slice(2)}`, amount }
  })

  const amounts    = monthly.map(m => m.amount)
  const avgRevenue = amounts.reduce((s, a) => s + a, 0) / amounts.length
  const growthRate = amounts.length >= 2
    ? ((amounts[amounts.length - 1] - amounts[0]) / (amounts[0] || 1)) * 100
    : 0

  const trendData = monthly.map(m => `${m.label}: ${m.amount.toLocaleString()} XAF`).join(", ")

  const msg = await ai.messages.create({
    model:      "claude-sonnet-4-6",
    max_tokens: 600,
    system:     "You are a financial analyst for NMI Education, a Cameroonian educational publisher. Provide data-driven analysis and forecasts.",
    messages:   [{
      role:    "user",
      content: `Analyse this 6-month revenue data for NMI Education and generate a 3-month forecast narrative:

Revenue trend: ${trendData}
Average monthly revenue: ${Math.round(avgRevenue).toLocaleString()} XAF
6-month growth rate: ${growthRate.toFixed(1)}%
Today: ${new Date().toISOString().slice(0, 10)}

Provide:
## Revenue Trend Analysis
## 3-Month Forecast
## Seasonal Factors (back-to-school in September, year-end in June/July)
## Key Risks
## Recommendations

Maximum 350 words. Be specific with XAF amounts where possible.`,
    }],
  })

  const forecast = msg.content[0]?.type === "text" ? msg.content[0].text : "Forecast unavailable."

  // Predict next month (simple linear extrapolation)
  const lastTwo = amounts.slice(-2)
  const predictedNextMonth = lastTwo.length === 2
    ? Math.max(0, lastTwo[1] + (lastTwo[1] - lastTwo[0]))
    : avgRevenue

  await prisma.notification.create({
    data: {
      type:      "financial_forecast",
      title:     `Financial Forecast — ${new Date().toISOString().slice(0, 10)}`,
      message:   forecast,
      severity:  growthRate < -10 ? "high" : "info",
      companyId: companyId ?? null,
    },
  })

  return {
    actions: 1,
    summary: `Generated 3-month financial forecast. Avg monthly revenue: ${Math.round(avgRevenue).toLocaleString()} XAF, growth: ${growthRate.toFixed(1)}%`,
    details: {
      forecastGenerated:   true,
      avgMonthlyRevenue:   Math.round(avgRevenue),
      growthRate:          parseFloat(growthRate.toFixed(1)),
      predictedNextMonth:  Math.round(predictedNextMonth),
      monthlyData:         monthly,
    },
  }
}
