import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendLeadAutoReply } from "@/lib/solapi";
import { rateLimit } from "@/lib/ratelimit";
import { z } from "zod";

const Input = z.object({
  name: z.string().min(1).max(50),
  phone: z.string().min(8).max(20),
  email: z.string().email().optional().or(z.literal("")),
  interest: z.string().max(100).optional(),
  message: z.string().max(1000).optional(),
  source: z.string().max(30).optional(),     // utm 등
  consent: z.literal(true, { errorMap: () => ({ message: "개인정보 수집·이용 동의가 필요합니다." }) }),
  website: z.string().optional(),            // 허니팟(봇 차단): 채워지면 무시
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`apply:${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: "잠시 후 다시 시도해 주세요." }, { status: 429 });
  }

  const parsed = Input.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "입력 오류" }, { status: 400 });
  }
  const d = parsed.data;
  if (d.website) return NextResponse.json({ ok: true }); // 허니팟 걸림 → 조용히 성공 응답

  const lead = await prisma.lead.create({
    data: {
      name: d.name, phone: d.phone, email: d.email || null,
      interest: d.interest || null, memo: d.message || null,
      source: d.source || "landing", stage: "NEW",
    },
  });

  if (lead.phone) sendLeadAutoReply(lead.phone, lead.name).catch((e) => console.error(e));

  return NextResponse.json({ ok: true });
}
