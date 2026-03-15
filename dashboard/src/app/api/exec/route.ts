import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ordersToday: 12,
    openInvoices: 34,
    stockAlerts: 5,
    receivables: 8,
    printJobs: 3,
    branchStatus: "OK",
  });
}
