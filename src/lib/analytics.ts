import { prisma } from "@/lib/prisma";

function monthKey(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; }

// 최근 N개월 월별 매출(PAID 합계)
export async function getMonthlyRevenue(months = 6) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const payments = await prisma.payment.findMany({
    where: { status: "PAID", paidAt: { gte: start } },
    select: { amount: true, paidAt: true },
  });

  // 빈 달도 0으로 채우기
  const buckets = new Map<string, number>();
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1) + i, 1);
    buckets.set(monthKey(d), 0);
  }
  for (const p of payments) {
    if (!p.paidAt) continue;
    const k = monthKey(p.paidAt);
    if (buckets.has(k)) buckets.set(k, (buckets.get(k) ?? 0) + p.amount);
  }
  return Array.from(buckets, ([month, revenue]) => ({ month, revenue }));
}

// 유입경로별 전환율 (WON / 전체 리드)
export async function getConversionBySource() {
  const leads = await prisma.lead.findMany({ select: { source: true, stage: true } });
  const map = new Map<string, { total: number; won: number }>();
  for (const l of leads) {
    const key = l.source ?? "기타";
    const cur = map.get(key) ?? { total: 0, won: 0 };
    cur.total += 1;
    if (l.stage === "WON") cur.won += 1;
    map.set(key, cur);
  }
  return Array.from(map, ([source, v]) => ({
    source, total: v.total, won: v.won,
    rate: v.total ? Math.round((v.won / v.total) * 1000) / 10 : 0, // % 소수1
  })).sort((a, b) => b.total - a.total);
}
