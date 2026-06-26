import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/authz";
import { toCsv, csvResponse } from "@/lib/csv";

export async function GET() {
  const { error } = await requireOwner();
  if (error) return error;

  const payments = await prisma.payment.findMany({ orderBy: { createdAt: "desc" }, include: { contact: true } });
  const csv = toCsv(
    ["고객", "금액", "상태", "수단", "결제수단사", "결제일", "환불일", "생성일"],
    payments.map((p) => [
      p.contact.name, p.amount, p.status, p.method, p.provider,
      p.paidAt ? p.paidAt.toISOString().slice(0, 10) : "",
      p.refundedAt ? p.refundedAt.toISOString().slice(0, 10) : "",
      p.createdAt.toISOString().slice(0, 10),
    ]),
  );
  return csvResponse(`payments_${new Date().toISOString().slice(0, 10)}.csv`, csv);
}
