"use client";

import { useState } from "react";
import type { Lead } from "./LeadBoard";

const SOURCES = ["instagram", "blog", "youtube", "offline", "referral", "etc"];

export default function LeadFormModal({
  onClose, onCreated,
}: { onClose: () => void; onCreated: (lead: Lead) => void }) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", source: "instagram", interest: "", memo: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(k: K, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("이름을 입력하세요."); return; }
    setSaving(true); setError(null);
    try {
      const body: Record<string, string> = { name: form.name, source: form.source };
      if (form.phone) body.phone = form.phone;
      if (form.email) body.email = form.email;
      if (form.interest) body.interest = form.interest;
      if (form.memo) body.memo = form.memo;

      const res = await fetch("/api/leads", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("저장 실패");
      onCreated(await res.json());
    } catch (err: any) {
      setError(err.message ?? "오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()} onSubmit={submit}
        className="w-full max-w-md rounded-lg bg-white p-5 shadow-lg"
      >
        <h2 className="mb-4 text-lg font-bold">리드 추가</h2>

        <div className="flex flex-col gap-3 text-sm">
          <label className="flex flex-col gap-1">
            <span className="text-gray-600">이름 *</span>
            <input value={form.name} onChange={(e) => set("name", e.target.value)}
              className="rounded border px-3 py-2" placeholder="홍길동" autoFocus />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-gray-600">연락처</span>
              <input value={form.phone} onChange={(e) => set("phone", e.target.value)}
                className="rounded border px-3 py-2" placeholder="010-0000-0000" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-gray-600">이메일</span>
              <input value={form.email} onChange={(e) => set("email", e.target.value)}
                className="rounded border px-3 py-2" placeholder="name@email.com" />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-gray-600">유입경로</span>
              <select value={form.source} onChange={(e) => set("source", e.target.value)} className="rounded border px-3 py-2">
                {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-gray-600">관심 강의</span>
              <input value={form.interest} onChange={(e) => set("interest", e.target.value)}
                className="rounded border px-3 py-2" placeholder="파이썬 입문" />
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-gray-600">메모</span>
            <textarea value={form.memo} onChange={(e) => set("memo", e.target.value)}
              className="rounded border px-3 py-2" rows={2} placeholder="상담 내용/요청사항" />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded border px-3 py-2 text-sm">취소</button>
          <button type="submit" disabled={saving} className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50">
            {saving ? "저장 중…" : "추가"}
          </button>
        </div>
      </form>
    </div>
  );
}
