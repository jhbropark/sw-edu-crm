import { prisma } from "@/lib/prisma";
import { basicEmailHtml } from "@/lib/email";

function startOfDay(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }

// 운영자용 일일 요약: 어제 신규리드/매출, 결제대기, 오늘 연락할 사람
export async function buildDailyDigest(now = new Date()) {
  const todayStart = startOfDay(now);
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);

  const [newLeads, revenueAgg, pending, dueLeads] = await Promise.all([
    prisma.lead.count({ where: { createdAt: { gte: yesterdayStart, lt: todayStart } } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "PAID", paidAt: { gte: yesterdayStart, lt: todayStart } } }),
    prisma.payment.count({ where: { status: "PENDING" } }),
    prisma.lead.findMany({ where: { nextActionAt: { lte: now }, stage: { notIn: ["WON", "LOST"] } }, take: 20, orderBy: { nextActionAt: "asc" } }),
  ]);

  const yRevenue = revenueAgg._sum.amount ?? 0;
  const dateStr = yesterdayStart.toLocaleDateString("ko-KR");

  const dueList = dueLeads.length
    ? `<ul>${dueLeads.map((l) => `<li>${l.name} · ${l.interest ?? "-"} (${l.phone ?? "-"})</li>`).join("")}</ul>`
    : "<p>예정된 후속 연락이 없습니다.</p>";

  const body = `
    <p><b>${dateStr}</b> 요약</p>
    <ul>
      <li>신규 리드: <b>${newLeads}</b>건</li>
      <li>매출(완료): <b>${yRevenue.toLocaleString()}</b>원</li>
      <li>결제 대기: <b>${pending}</b>건</li>
    </ul>
    <p style="margin-top:16px;"><b>오늘 연락할 사람 (${dueLeads.length})</b></p>
    ${dueList}
  `;

  return {
    subject: `[SW 교육 CRM] 일일 요약 — 신규 ${newLeads} · 매출 ${yRevenue.toLocaleString()}원`,
    html: basicEmailHtml("일일 운영 요약", body),
    summary: { newLeads, yRevenue, pending, due: dueLeads.length },
  };
}
