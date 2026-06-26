import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireOwner } from "@/lib/authz";
import { audit } from "@/lib/audit";

const Patch = z.object({ status: z.enum(["draft", "active", "paused"]) });

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireOwner();
  if (error) return error;
  const parsed = Patch.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const c = await prisma.campaign.update({ where: { id: params.id }, data: parsed.data });
  await audit("campaign.status_change", { entity: "campaign", entityId: c.id, meta: { status: parsed.data.status } });
  return NextResponse.json(c);
}
