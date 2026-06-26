import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";
import { getPeriodStats } from "@/lib/stats";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { error } = await requireUser();
  if (error) return error;
  const sp = req.nextUrl.searchParams;
  const month = sp.get("month") === "1";
  const days = Math.min(365, Math.max(1, Number(sp.get("days") ?? 30)));
  return NextResponse.json(await getPeriodStats(days, month));
}
