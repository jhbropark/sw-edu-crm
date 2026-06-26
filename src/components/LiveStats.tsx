"use client";

import { useEffect, useRef, useState } from "react";
import type { Stats } from "@/lib/stats";

const REFRESH_MS = 30_000;

export default function LiveStats({ initial }: { initial: Stats }) {
  const [stats, setStats] = useState<Stats>(initial);
  const [live, setLive] = useState(true);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function tick() {
      try {
        const res = await fetch("/api/stats", { cache: "no-store" });
        if (res.ok) setStats(await res.json());
      } catch { /* 네트워크 일시 오류 무시 */ }
    }
    if (live) {
      timer.current = setInterval(tick, REFRESH_MS);
      return () => { if (timer.current) clearInterval(timer.current); };
    }
  }, [live]);

  const cards = [
    { label: "이번 달 매출", value: `${stats.monthRevenue.toLocaleString()}원` },
    { label: "결제 대기", value: `${stats.pendingPayments}건` },
    { label: "진행 중 리드", value: `${stats.openLeads}건` },
    { label: "오늘 연락할 사람", value: `${stats.dueLeads}명` },
  ];

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className={`inline-block h-2 w-2 rounded-full ${live ? "bg-green-500" : "bg-gray-300"}`} aria-hidden="true" />
          <span>{live ? "실시간" : "일시정지"} · {new Date(stats.updatedAt).toLocaleTimeString("ko-KR")} 기준</span>
        </div>
        <button onClick={() => setLive((v) => !v)} className="text-xs text-gray-500 hover:underline"
          aria-pressed={live}>{live ? "자동 새로고침 끄기" : "자동 새로고침 켜기"}</button>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border bg-white p-4">
            <div className="text-sm text-gray-500">{c.label}</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">{c.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
