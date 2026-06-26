import { prisma } from "@/lib/prisma";
import { getMonthlyRevenue, getConversionBySource } from "@/lib/analytics";
import { getStats, getPeriodStats } from "@/lib/stats";
import LiveStats from "@/components/LiveStats";
import PeriodFilter from "@/components/PeriodFilter";
import OnboardingChecklist from "@/components/OnboardingChecklist";
import DashboardCharts from "@/components/DashboardCharts";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const [stats, periodInit, dueLeads, monthly, conversion] = await Promise.all([
    getStats(),
    getPeriodStats(30),
    prisma.lead.findMany({ where: { nextActionAt: { lte: new Date() }, stage: { notIn: ["WON", "LOST"] } }, take: 10 }),
    getMonthlyRevenue(6),
    getConversionBySource(),
  ]);

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">대시보드</h1>

      <OnboardingChecklist />

      <div className="mb-6">
        <LiveStats initial={stats} />
      </div>

      <div className="mb-6">
        <PeriodFilter initial={periodInit} />
      </div>

      <div className="mb-6">
        <DashboardCharts monthly={monthly} conversion={conversion} />
      </div>

      <section className="rounded-lg border bg-white p-4">
        <h2 className="mb-3 font-semibold">오늘 연락할 사람</h2>
        {dueLeads.length === 0 ? (
          <p className="text-sm text-gray-500">예정된 후속 연락이 없습니다.</p>
        ) : (
          <ul className="divide-y">
            {dueLeads.map((l) => (
              <li key={l.id} className="flex items-center justify-between py-2 text-sm">
                <span>{l.name} · {l.interest ?? "-"}</span>
                <span className="text-gray-500">{l.phone}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
