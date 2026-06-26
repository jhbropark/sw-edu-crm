import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/authz";
import { toCsv, csvResponse } from "@/lib/csv";

export async function GET() {
  const { error } = await requireOwner();
  if (error) return error;

  const leads = await prisma.lead.findMany({ orderBy: { createdAt: "desc" } });
  const csv = toCsv(
    ["이름", "연락처", "이메일", "단계", "유입경로", "관심강의", "다음연락일", "등록일"],
    leads.map((l) => [
      l.name, l.phone, l.email, l.stage, l.source, l.interest,
      l.nextActionAt ? l.nextActionAt.toISOString().slice(0, 10) : "",
      l.createdAt.toISOString().slice(0, 10),
    ]),
  );
  return csvResponse(`leads_${new Date().toISOString().slice(0, 10)}.csv`, csv);
}
