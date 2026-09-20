import { NextRequest, NextResponse } from "next/server";
import { dashboardDays, getDashboard } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(await getDashboard(dashboardDays(request.nextUrl.searchParams.get("days"))), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Dashboard query failed", error);
    return NextResponse.json({ error: "Reporting data is unavailable. Check the database and migrations." }, { status: 503 });
  }
}
