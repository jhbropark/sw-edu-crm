import { prisma } from "@/lib/prisma";
import { startOfMonth } from "date-fns";

export type Stats = {
  monthRevenue: number;
  pendingPayments: number;
  openLeads: number;
  dueLeads: number;
  updatedAt: string;
};

export async function getStats(): Promise<Stats> {
  const monthStart = startOfMonth(new Date());
  const [rev, pending, open, due] = await Promise.all([
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "PAID", paidAt: { gte: monthStart } } }),
    prisma.payment.count({ where: { status: "PENDING" } }),
    prisma.lead.count({ where: { stage: { notIn: ["WON", "LOST"] } } }),
    prisma.lead.count({ where: { nextActionAt: { lte: new Date() }, stage: { notIn: ["WON", "LOST"] } } }),
  ]);
  return {
    monthRevenue: rev._sum.amount ?? 0,
    pendingPayments: pending,
    openLeads: open,
    dueLeads: due,
    updatedAt: new Date().toISOString(),
  };
}

export type PeriodStats = {
  range: string;
  revenue: number;
  paidCount: number;
  newLeads: number;
  wonLeads: number;
  convRate: number; // %
};

// 기간(일수) 기준 집계. month=true면 이번 달 1일부터.
export async function getPeriodStats(days: number, monthMode = false): Promise<PeriodStats> {
  const now = new Date();
  const from = monthMode ? startOfMonth(now) : new Date(now.getTime() - days * 86400000);

  const [revAgg, paidCount, newLeads, wonLeads] = await Promise.all([
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "PAID", paidAt: { gte: from } } }),
    prisma.payment.count({ where: { status: "PAID", paidAt: { gte: from } } }),
    prisma.lead.count({ where: { createdAt: { gte: from } } }),
    prisma.lead.count({ where: { createdAt: { gte: from }, stage: "WON" } }),
  ]);

  return {
    range: monthMode ? "이번 달" : `최근 ${days}일`,
    revenue: revAgg._sum.amount ?? 0,
    paidCount,
    newLeads,
    wonLeads,
    convRate: newLeads ? Math.round((wonLeads / newLeads) * 1000) / 10 : 0,
  };
}
