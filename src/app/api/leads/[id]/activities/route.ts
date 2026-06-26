import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const Input = z.object({
  type: z.enum(["note", "call", "message", "meeting"]),
  content: z.string().min(1).max(2000),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const parsed = Input.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const lead = await prisma.lead.findUnique({ where: { id: params.id } });
  if (!lead) return NextResponse.json({ error: "리드 없음" }, { status: 404 });

  const activity = await prisma.activity.create({
    data: { leadId: params.id, type: parsed.data.type, content: parsed.data.content },
  });
  return NextResponse.json(activity, { status: 201 });
}
