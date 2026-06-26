import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireOwner } from "@/lib/authz";
import { audit } from "@/lib/audit";

const StepInput = z.object({ delayDays: z.number().int().min(0), template: z.string().min(1), variant: z.enum(["A", "B"]).optional().nullable() });
const Input = z.object({
  name: z.string().min(1),
  channel: z.enum(["alimtalk", "sms", "email"]),
  trigger: z.string().regex(/^(enrollment\.completed|lead\.created)\+\d+d$/, "트리거 형식 오류"),
  status: z.enum(["draft", "active", "paused"]).default("draft"),
  steps: z.array(StepInput).min(1),
});

export async function GET() {
  const campaigns = await prisma.campaign.findMany({
    include: { steps: { orderBy: { order: "asc" } } }, orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(campaigns);
}

export async function POST(req: NextRequest) {
  const { error } = await requireOwner();
  if (error) return error;
  const parsed = Input.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { steps, ...c } = parsed.data;

  const campaign = await prisma.campaign.create({
    data: {
      ...c,
      steps: { create: steps.map((s, i) => ({ order: i, delayDays: s.delayDays, template: s.template, variant: s.variant ?? null })) },
    },
    include: { steps: true },
  });
  await audit("campaign.create", { entity: "campaign", entityId: campaign.id, meta: { name: campaign.name, channel: campaign.channel } });
  return NextResponse.json(campaign, { status: 201 });
}
