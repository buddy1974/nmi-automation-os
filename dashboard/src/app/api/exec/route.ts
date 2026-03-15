import { NextResponse } from "next/server";
import { orders, invoices, stock } from "@/lib/data";

export async function GET() {
  const today = new Date().toISOString().split("T")[0];

  const ordersToday  = orders.filter((o) => o.date === today).length;
  const openInvoices = invoices.filter((i) => i.status !== "paid").length;
  const stockAlerts  = stock.filter((s) => s.qty < 10).length;
  const receivables  = invoices.filter((i) => i.status === "unpaid").length;

  return NextResponse.json({
    ordersToday,
    openInvoices,
    stockAlerts,
    receivables,
    printJobs: 0,
    branchStatus: "OK",
  });
}
