import { NextRequest, NextResponse } from "next/server";
import { purgeExpiredPersonalData } from "@/lib/privacy";

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await purgeExpiredPersonalData();
  return NextResponse.json(result);
}
