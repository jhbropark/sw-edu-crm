"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Activity = { id: string; type: string; content: string; createdAt: string };

const TYPE_LABEL: Record<string, string> = { note: "메모", call: "통화", message: "메시지", meeting: "미팅" };

export default function LeadActivity({
  leadId, initialActivities, nextActionAt,
}: { leadId: string; initialActivities: Activity[]; nextActionAt: string | null }) {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [type, setType] = useState("note");
  const [content, setContent] = useState("");
  const [nextAt, setNextAt] = useState(nextActionAt ? nextActionAt.slice(0, 10) : "");
  const [saving, setSaving] = useState(false);

  async function addActivity(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/leads/${leadId}/activities`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, content }),
    });
    setSaving(false);
    if (res.ok) { setActivities((a) => [await res.json(), ...a]); setContent(""); }
  }

  async function saveNextAction() {
    await fetch(`/api/leads/${leadId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nextActionAt: nextAt ? new Date(nextAt + "T09:00:00").toISOString() : null }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold">다음 연락 예정일</h2>
        <div className="flex gap-2">
          <input type="date" value={nextAt} onChange={(e) => setNextAt(e.target.value)} className="rounded border px-3 py-2 text-sm" />
          <button onClick={saveNextAction} className="rounded border px-3 py-2 text-sm">저장</button>
        </div>
      </div>

      <form onSubmit={addActivity} className="rounded-lg border bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold">상담 기록 추가</h2>
        <div className="mb-2 flex gap-2">
          <select value={type} onChange={(e) => setType(e.target.value)} className="rounded border px-3 py-2 text-sm">
            {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input value={content} onChange={(e) => setContent(e.target.value)} placeholder="상담 내용/메모" className="flex-1 rounded border px-3 py-2 text-sm" />
          <button disabled={saving} className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50">추가</button>
        </div>
      </form>

      <div className="rounded-lg border bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold">타임라인</h2>
        {activities.length === 0 ? (
          <p className="text-sm text-gray-500">아직 기록이 없습니다.</p>
        ) : (
          <ol className="relative space-y-4 border-l pl-4">
            {activities.map((a) => (
              <li key={a.id} className="relative">
                <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-gray-400" />
                <div className="text-xs text-gray-400">
                  {new Date(a.createdAt).toLocaleString("ko-KR")} · {TYPE_LABEL[a.type] ?? a.type}
                </div>
                <div className="text-sm">{a.content}</div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
