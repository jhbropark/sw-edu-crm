import { NextRequest, NextResponse } from "next/server";
import { enqueueDueCampaigns } from "@/lib/campaigns";

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await enqueueDueCampaigns();
  return NextResponse.json(result);
}
