import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { buildDailyDigest } from "@/lib/digest";

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const owners = await prisma.user.findMany({ where: { role: "OWNER" }, select: { email: true } });
  const recipients = owners.map((o) => o.email).filter(Boolean);
  if (recipients.length === 0) return NextResponse.json({ sent: 0, reason: "no owner email" });

  const digest = await buildDailyDigest();
  const result = await sendEmail({ to: recipients, subject: digest.subject, html: digest.html });

  return NextResponse.json({ sent: result.ok ? recipients.length : 0, ok: result.ok, error: result.error, summary: digest.summary });
}
