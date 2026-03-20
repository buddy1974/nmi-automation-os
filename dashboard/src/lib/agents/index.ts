import { runSalesHunter }        from "./salesHunter"
import { runReceivables }         from "./receivables"
import { runAuthorRelations }     from "./authorRelations"
import { runStockIntelligence }   from "./stockIntelligence"
import { runCompetitiveIntel }    from "./competitiveIntel"
import { runHrPulse }             from "./hrPulse"
import { runFinancialForecast }   from "./financialForecast"
import { runDocumentIntel }       from "./documentIntel"

export interface AgentResult {
  actions:  number
  summary:  string
  details:  Record<string, unknown>
}

export interface AgentDef {
  id:          string
  name:        string
  description: string
  schedule:    string
  fn:          (companyId?: string) => Promise<AgentResult>
}

export const AGENTS: AgentDef[] = [
  {
    id:          "sales_hunter",
    name:        "Sales Hunter",
    description: "Finds dormant customers (60+ days) and drafts personalised re-engagement emails",
    schedule:    "Every Monday 08:00",
    fn:          runSalesHunter,
  },
  {
    id:          "receivables",
    name:        "Receivables Agent",
    description: "Finds unpaid invoices >30 days and drafts professional payment reminders",
    schedule:    "Daily 09:00",
    fn:          runReceivables,
  },
  {
    id:          "author_relations",
    name:        "Author Relations",
    description: "Monitors manuscript status changes and royalties due; drafts author update emails",
    schedule:    "Every Wednesday 10:00",
    fn:          runAuthorRelations,
  },
  {
    id:          "stock_intelligence",
    name:        "Stock Intelligence",
    description: "Detects low-stock products and creates restock tasks for the printing department",
    schedule:    "Daily 07:00",
    fn:          runStockIntelligence,
  },
  {
    id:          "competitive_intel",
    name:        "Competitive Intel",
    description: "Generates an AI briefing on Cameroonian educational publishing market trends",
    schedule:    "Weekly Monday 07:00",
    fn:          runCompetitiveIntel,
  },
  {
    id:          "hr_pulse",
    name:        "HR Pulse",
    description: "Monitors attendance gaps, overdue tasks, and missing evaluations; alerts HR",
    schedule:    "Daily 08:30",
    fn:          runHrPulse,
  },
  {
    id:          "financial_forecast",
    name:        "Financial Forecast",
    description: "Analyses 6-month revenue trend and generates a 3-month AI forecast narrative",
    schedule:    "1st of month 06:00",
    fn:          runFinancialForecast,
  },
  {
    id:          "document_intel",
    name:        "Document Intel",
    description: "Processes new knowledge base docs — extracts entities, summaries, and action items",
    schedule:    "Daily 06:30",
    fn:          runDocumentIntel,
  },
]

export function getAgent(agentId: string): AgentDef | undefined {
  return AGENTS.find(a => a.id === agentId)
}
