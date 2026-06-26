import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/authz";
import { findDuplicateGroups } from "@/lib/dedupe";

export async function GET() {
  const { error } = await requireUser();
  if (error) return error;

  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, phone: true, email: true, stage: true, createdAt: true },
  });
  const groups = findDuplicateGroups(leads);
  const byId = new Map(leads.map((l) => [l.id, l]));
  return NextResponse.json(groups.map((ids) => ids.map((id) => byId.get(id))));
}
