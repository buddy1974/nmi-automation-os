import { NextResponse } from "next/server";
import { orders, customers, branches } from "@/lib/data";

export async function GET() {
  const enriched = orders.map((order) => ({
    ...order,
    customer: customers.find((c) => c.id === order.customer_id)?.name ?? "Unknown",
    branch:   branches.find((b) => b.id === order.branch_id)?.name   ?? "Unknown",
  }));

  return NextResponse.json(enriched);
}
