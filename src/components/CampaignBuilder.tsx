"use client";

import { useState } from "react";
import EmptyState from "./EmptyState";

type Step = { delayDays: number; template: string; variant?: "A" | "B" | "" };
export type Campaign = {
  id: string; name: string; channel: string; trigger: string | null; status: string;
  steps: { id: string; order: number; delayDays: number; template: string }[];
};

const TRIGGERS = [
  { value: "enrollment.completed+90d", label: "수강 완료 90일 후" },
  { value: "enrollment.completed+30d", label: "수강 완료 30일 후" },
  { value: "lead.created+3d", label: "리드 생성 3일 후(미전환 리마인드)" },
  { value: "lead.created+7d", label: "리드 생성 7일 후(미전환 리마인드)" },
];

export default function CampaignBuilder({ initial }: { initial: Campaign[] }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initial);
  const [open, setOpen] = useState(false);

  async function toggle(c: Campaign) {
    const next = c.status === "active" ? "paused" : "active";
    const prev = campaigns;
    setCampaigns((cs) => cs.map((x) => (x.id === c.id ? { ...x, status: next } : x)));
    const res = await fetch(`/api/campaigns/${c.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }),
    });
    if (!res.ok) setCampaigns(prev);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">마케팅 자동화</h1>
        <button onClick={() => setOpen(true)} className="rounded bg-black px-3 py-2 text-sm text-white">+ 캠페인 생성</button>
      </div>

      {campaigns.length === 0 ? (
        <EmptyState title="아직 캠페인이 없어요" description="수료 90일 후 다음 과정 안내처럼 자동 발송 캠페인을 만들어 재등록을 유도하세요." secondary={{ href: "/help", label: "도움말 보기" }} />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {campaigns.map((c) => (
            <li key={c.id} className="rounded-lg border bg-white p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-gray-500">{c.channel} · 트리거 {c.trigger}</div>
                </div>
                <button onClick={() => toggle(c)}
                  className={`rounded px-2 py-1 text-xs ${c.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                  {c.status === "active" ? "활성" : c.status === "paused" ? "일시정지" : "초안"}
                </button>
              </div>
              <ol className="mt-3 space-y-1 text-sm text-gray-600">
                {c.steps.map((s) => (
                  <li key={s.id}>+{s.delayDays}일 → {s.template.length > 30 ? s.template.slice(0, 30) + "…" : s.template}</li>
                ))}
              </ol>
            </li>
          ))}
        </ul>
      )}

      {open && <BuilderModal onClose={() => setOpen(false)} onCreated={(c) => { setCampaigns((cs) => [c, ...cs]); setOpen(false); }} />}
    </div>
  );
}

function BuilderModal({ onClose, onCreated }: { onClose: () => void; onCreated: (c: Campaign) => void }) {
  const [name, setName] = useState("");
  const [channel, setChannel] = useState("alimtalk");
  const [trigger, setTrigger] = useState(TRIGGERS[0].value);
  const [steps, setSteps] = useState<Step[]>([{ delayDays: 0, template: "", variant: "" }]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function updateStep(i: number, patch: Partial<Step>) {
    setSteps((ss) => ss.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || steps.some((s) => !s.template.trim())) { setError("이름과 모든 스텝 내용을 입력하세요."); return; }
    setSaving(true); setError(null);
    const res = await fetch("/api/campaigns", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, channel, trigger, status: "draft", steps: steps.map((s) => ({ delayDays: s.delayDays, template: s.template, variant: s.variant || null })) }),
    });
    setSaving(false);
    if (!res.ok) { setError("저장 실패"); return; }
    onCreated(await res.json());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-lg rounded-lg bg-white p-5 shadow-lg">
        <h2 className="mb-4 text-lg font-bold">캠페인 생성</h2>
        <div className="flex flex-col gap-3 text-sm">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="캠페인 이름" className="rounded border px-3 py-2" autoFocus />
          <div className="grid grid-cols-2 gap-3">
            <select value={channel} onChange={(e) => setChannel(e.target.value)} className="rounded border px-3 py-2">
              <option value="alimtalk">알림톡</option>
              <option value="sms">문자(SMS)</option>
              <option value="email">이메일</option>
            </select>
            <select value={trigger} onChange={(e) => setTrigger(e.target.value)} className="rounded border px-3 py-2">
              {TRIGGERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div className="mt-1">
            <div className="mb-1 flex items-center justify-between">
              <span className="font-medium">스텝</span>
              <button type="button" onClick={() => setSteps((ss) => [...ss, { delayDays: 0, template: "", variant: "" }])}
                className="text-xs text-blue-600">+ 스텝 추가</button>
            </div>
            <div className="flex flex-col gap-2">
              {steps.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <div className="flex items-center gap-1">
                    <input type="number" min={0} value={s.delayDays}
                      onChange={(e) => updateStep(i, { delayDays: Number(e.target.value) })}
                      className="w-16 rounded border px-2 py-2" />
                    <span className="text-xs text-gray-500">일 뒤</span>
                  </div>
                  <input value={s.template} onChange={(e) => updateStep(i, { template: e.target.value })}
                    placeholder={channel === "alimtalk" ? "템플릿 ID 또는 본문" : "메시지 본문"} className="flex-1 rounded border px-3 py-2" />
                  <select value={s.variant ?? ""} onChange={(e) => updateStep(i, { variant: e.target.value as Step["variant"] })}
                    className="w-20 rounded border px-2 py-2" aria-label="A/B 분기" title="A/B 분기(공통/A/B)">
                    <option value="">공통</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                  </select>
                  {steps.length > 1 && (
                    <button type="button" onClick={() => setSteps((ss) => ss.filter((_, idx) => idx !== i))}
                      className="px-2 text-gray-400">×</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-red-600">{error}</p>}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded border px-3 py-2 text-sm">취소</button>
          <button disabled={saving} className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50">
            {saving ? "저장 중…" : "생성(초안)"}
          </button>
        </div>
      </form>
    </div>
  );
}
