import { NextResponse } from "next/server";
import { getExecMetrics } from "@/lib/exec-metrics";

export async function GET() {
  return NextResponse.json(getExecMetrics());
}
