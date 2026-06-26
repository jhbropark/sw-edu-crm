import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSms, sendAlimtalk } from "@/lib/solapi";
import { sendEmail, basicEmailHtml } from "@/lib/email";

// Vercel Cron이 주기 호출 → 보낼 때가 된 예약 메시지 발송
export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const due = await prisma.scheduledMessage.findMany({
    where: { status: "queued", sendAt: { lte: new Date() } },
    take: 100, orderBy: { sendAt: "asc" },
  });

  let sent = 0;
  for (const m of due) {
    const contact = await prisma.contact.findUnique({ where: { id: m.contactId } });
    const to = contact?.phone;
    try {
      if (m.channel !== "email" && !to) throw new Error("수신 연락처 없음");

      let result: { ok: boolean; error?: string };
      if (m.channel === "alimtalk") {
        result = await sendAlimtalk({
          to: to!, pfId: process.env.KAKAO_PFID ?? "",
          templateId: m.subject ?? "", fallbackText: m.body,
        });
      } else if (m.channel === "email") {
        const contactEmail = contact?.email;
        if (!contactEmail) throw new Error("수신 이메일 없음");
        result = await sendEmail({
          to: contactEmail,
          subject: m.subject || "안내 메일",
          html: basicEmailHtml(m.subject || "안내", m.body),
        });
      } else {
        result = await sendSms({ to: to!, text: m.body });
      }

      if (!result.ok) throw new Error(result.error);

      await prisma.scheduledMessage.update({ where: { id: m.id }, data: { status: "sent", sentAt: new Date() } });
      sent++;
    } catch (e: any) {
      await prisma.scheduledMessage.update({ where: { id: m.id }, data: { status: "failed", error: String(e?.message ?? e) } });
    }
  }
  return NextResponse.json({ processed: due.length, sent });
}
