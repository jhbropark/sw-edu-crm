import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";
import { getStats } from "@/lib/stats";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requireUser();
  if (error) return error;
  return NextResponse.json(await getStats());
}
