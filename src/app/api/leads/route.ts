import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendLeadAutoReply } from "@/lib/solapi";
import { z } from "zod";

const LeadInput = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  source: z.string().optional(),
  interest: z.string().optional(),
  memo: z.string().optional(),
});

export async function GET() {
  const leads = await prisma.lead.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(leads);
}

// 랜딩폼/수동 입력에서 리드 생성 → 알림톡 자동응답
export async function POST(req: NextRequest) {
  const parsed = LeadInput.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const lead = await prisma.lead.create({ data: { ...parsed.data, stage: "NEW" } });

  // 발송 실패가 리드 생성을 막지 않도록 try/catch (베스트 에포트)
  if (lead.phone) {
    sendLeadAutoReply(lead.phone, lead.name).catch((e) => console.error("autoReply 실패", e));
  }
  return NextResponse.json(lead, { status: 201 });
}
