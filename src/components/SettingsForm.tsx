"use client";

import { useState } from "react";

type Settings = {
  businessName: string; senderName: string; senderPhone: string;
  defaultChannel: string; retentionDays: number;
};

export default function SettingsForm({ initial }: { initial: Settings }) {
  const [form, setForm] = useState<Settings>(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function set<K extends keyof Settings>(k: K, v: Settings[K]) { setForm((f) => ({ ...f, [k]: v })); }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMsg(null);
    const res = await fetch("/api/settings", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, retentionDays: Number(form.retentionDays) }),
    });
    setSaving(false);
    setMsg(res.ok ? "저장되었습니다." : "저장 실패");
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4 rounded-lg border bg-white p-5 text-sm">
      <label className="flex flex-col gap-1">
        <span className="text-gray-600">상호/브랜드명</span>
        <input value={form.businessName} onChange={(e) => set("businessName", e.target.value)} className="rounded border px-3 py-2" placeholder="OOO 교육" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-gray-600">발신자 표기명</span>
          <input value={form.senderName} onChange={(e) => set("senderName", e.target.value)} className="rounded border px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-gray-600">대표 연락처</span>
          <input value={form.senderPhone} onChange={(e) => set("senderPhone", e.target.value)} className="rounded border px-3 py-2" placeholder="010-0000-0000" />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-gray-600">캠페인 기본 채널</span>
          <select value={form.defaultChannel} onChange={(e) => set("defaultChannel", e.target.value)} className="rounded border px-3 py-2">
            <option value="alimtalk">알림톡</option>
            <option value="sms">문자(SMS)</option>
            <option value="email">이메일</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-gray-600">개인정보 보관기간(일)</span>
          <input type="number" min={30} max={3650} value={form.retentionDays}
            onChange={(e) => set("retentionDays", Number(e.target.value))} className="rounded border px-3 py-2" />
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button disabled={saving} className="rounded bg-black px-4 py-2 text-white disabled:opacity-50">
          {saving ? "저장 중…" : "저장"}
        </button>
        {msg && <span className="text-sm text-gray-500">{msg}</span>}
      </div>
    </form>
  );
}
