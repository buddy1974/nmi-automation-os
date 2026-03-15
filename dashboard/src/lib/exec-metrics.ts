import { orders, invoices, stock } from "@/lib/data";

export interface ExecMetrics {
  ordersToday: number;
  openInvoices: number;
  stockAlerts: number;
  receivables: number;
  printJobs: number;
  branchStatus: string;
}

export function getExecMetrics(): ExecMetrics {
  const today = new Date().toISOString().split("T")[0];

  return {
    ordersToday:  orders.filter((o) => o.date === today).length,
    openInvoices: invoices.filter((i) => i.status !== "paid").length,
    stockAlerts:  stock.filter((s) => s.qty < 10).length,
    receivables:  invoices.filter((i) => i.status === "unpaid").length,
    printJobs:    0,
    branchStatus: "OK",
  };
}
