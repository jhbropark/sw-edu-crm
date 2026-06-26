"use client";

import { useEffect, useState } from "react";
import type { PeriodStats } from "@/lib/stats";

const OPTIONS = [
  { label: "최근 7일", q: "days=7" },
  { label: "최근 30일", q: "days=30" },
  { label: "최근 90일", q: "days=90" },
  { label: "이번 달", q: "month=1" },
];

export default function PeriodFilter({ initial }: { initial: PeriodStats }) {
  const [sel, setSel] = useState(1); // 기본 30일
  const [stats, setStats] = useState<PeriodStats>(initial);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/stats/period?${OPTIONS[sel].q}`, { cache: "no-store" })
      .then((r) => r.json()).then((d) => { if (active) setStats(d); })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [sel]);

  const cards = [
    { label: "매출", value: `${stats.revenue.toLocaleString()}원` },
    { label: "결제 건수", value: `${stats.paidCount}건` },
    { label: "신규 리드", value: `${stats.newLeads}건` },
    { label: "전환율", value: `${stats.convRate}%` },
  ];

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">기간별 요약</h2>
        <div className="flex gap-1" role="group" aria-label="기간 선택">
          {OPTIONS.map((o, i) => (
            <button key={o.label} onClick={() => setSel(i)} aria-pressed={sel === i}
              className={`rounded px-2 py-1 text-xs ${sel === i ? "bg-black text-white" : "border hover:bg-gray-50"}`}>
              {o.label}
            </button>
          ))}
        </div>
      </div>
      <div className={`grid grid-cols-2 gap-3 md:grid-cols-4 ${loading ? "opacity-50" : ""}`}>
        {cards.map((c) => (
          <div key={c.label} className="rounded-md bg-gray-50 p-3">
            <div className="text-xs text-gray-500">{c.label}</div>
            <div className="mt-1 text-xl font-semibold tabular-nums">{c.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
