import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { audit } from "@/lib/audit";

const PatchInput = z.object({
  stage: z.enum(["NEW", "CONTACTED", "CONSULTING", "PROPOSAL", "WON", "LOST"]).optional(),
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  source: z.string().optional(),
  interest: z.string().optional(),
  memo: z.string().optional(),
  nextActionAt: z.string().datetime().optional().nullable(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const parsed = PatchInput.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { nextActionAt, ...rest } = parsed.data;
  const lead = await prisma.lead.update({
    where: { id: params.id },
    data: { ...rest, ...(nextActionAt !== undefined ? { nextActionAt: nextActionAt ? new Date(nextActionAt) : null } : {}) },
  });
  if (rest.stage) await audit("lead.stage_change", { entity: "lead", entityId: lead.id, meta: { stage: rest.stage } });
  return NextResponse.json(lead);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.lead.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
