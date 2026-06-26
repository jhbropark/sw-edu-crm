"use client";

import { useEffect, useState } from "react";

type Lead = { id: string; name: string; phone: string | null; email: string | null; stage: string; createdAt: string };

export default function DuplicateManager() {
  const [groups, setGroups] = useState<Lead[][]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/leads/duplicates", { cache: "no-store" });
    setGroups(res.ok ? await res.json() : []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function merge(group: Lead[], primaryId: string) {
    setBusy(primaryId);
    const mergeIds = group.filter((l) => l.id !== primaryId).map((l) => l.id);
    const res = await fetch("/api/leads/merge", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ primaryId, mergeIds }),
    });
    setBusy(null);
    if (res.ok) load(); else alert("병합 실패");
  }

  if (loading) return <p className="text-sm text-gray-500">중복 검사 중…</p>;
  if (groups.length === 0) return <p className="text-sm text-gray-500">중복으로 의심되는 리드가 없습니다.</p>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">전화/이메일이 같은 리드들을 묶었습니다. 남길 대표 리드를 선택해 병합하세요.</p>
      {groups.map((group, gi) => (
        <div key={gi} className="rounded-lg border bg-white p-4">
          <div className="mb-2 text-sm font-semibold">중복 그룹 {gi + 1} ({group.length}건)</div>
          <ul className="divide-y">
            {group.map((l) => (
              <li key={l.id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  <b>{l.name}</b> · {l.phone ?? "-"} · {l.email ?? "-"} · <span className="text-gray-500">{l.stage}</span>
                  <span className="ml-2 text-xs text-gray-400">{new Date(l.createdAt).toLocaleDateString("ko-KR")}</span>
                </span>
                <button onClick={() => merge(group, l.id)} disabled={busy === l.id}
                  className="rounded border px-3 py-1 text-xs hover:bg-gray-50 disabled:opacity-50">
                  이 리드로 병합
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
