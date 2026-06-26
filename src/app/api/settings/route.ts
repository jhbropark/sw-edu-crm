import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/authz";
import { getSettings } from "@/lib/settings";
import { audit } from "@/lib/audit";
import { z } from "zod";

export async function GET() {
  const { error } = await requireOwner();
  if (error) return error;
  return NextResponse.json(await getSettings());
}

const Input = z.object({
  businessName: z.string().max(100).optional().nullable(),
  senderName: z.string().max(50).optional().nullable(),
  senderPhone: z.string().max(20).optional().nullable(),
  defaultChannel: z.enum(["alimtalk", "sms", "email"]),
  retentionDays: z.number().int().min(30).max(3650),
});

export async function PUT(req: NextRequest) {
  const { error } = await requireOwner();
  if (error) return error;
  const parsed = Input.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await prisma.appSetting.upsert({
    where: { id: "singleton" },
    update: parsed.data,
    create: { id: "singleton", ...parsed.data },
  });
  await audit("settings.update", { entity: "setting", entityId: "singleton", meta: parsed.data });
  return NextResponse.json(updated);
}
