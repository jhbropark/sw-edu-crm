"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { makeT, normalizeLocale } from "@/lib/i18n";

function ApplyForm() {
  const params = useSearchParams();
  const locale = normalizeLocale(params.get("lang"));
  const t = makeT(locale);

  const [form, setForm] = useState({ name: "", phone: "", email: "", interest: "", message: "", website: "" });
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(k: K, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) { setError(t("apply.err.required")); return; }
    if (!consent) { setError(t("apply.err.consent")); return; }
    setState("saving"); setError(null);
    const res = await fetch("/api/public/leads", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, consent, source: "landing" }),
    });
    if (res.ok) setState("done");
    else { setState("error"); setError((await res.json()).error ?? "오류가 발생했습니다."); }
  }

  if (state === "done") {
    return (
      <div className="mx-auto max-w-md p-10 text-center" role="status" aria-live="polite">
        <h1 className="text-2xl font-bold text-green-600">{t("apply.done.title")}</h1>
        <p className="mt-2 text-gray-600">{t("apply.done.desc")}</p>
      </div>
    );
  }

  const req = `(${t("common.required")})`;

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="mb-1 text-2xl font-bold">{t("apply.title")}</h1>
      <p className="mb-5 text-sm text-gray-500">{t("apply.subtitle")}</p>

      <form onSubmit={submit} className="flex flex-col gap-3 text-sm" noValidate>
        {/* 허니팟: 보조기기·사용자 모두에서 숨김 */}
        <input value={form.website} onChange={(e) => set("website", e.target.value)}
          name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

        <div className="flex flex-col gap-1">
          <label htmlFor="f-name">{t("apply.name")} <span className="text-red-600">*</span></label>
          <input id="f-name" name="name" required aria-required="true"
            value={form.name} onChange={(e) => set("name", e.target.value)} className="rounded border px-3 py-2" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="f-phone">{t("apply.phone")} <span className="text-red-600">*</span></label>
          <input id="f-phone" name="phone" type="tel" inputMode="tel" required aria-required="true"
            value={form.phone} onChange={(e) => set("phone", e.target.value)} className="rounded border px-3 py-2" placeholder="010-0000-0000" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="f-email">{t("apply.email")}</label>
          <input id="f-email" name="email" type="email" autoComplete="email"
            value={form.email} onChange={(e) => set("email", e.target.value)} className="rounded border px-3 py-2" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="f-interest">{t("apply.interest")}</label>
          <input id="f-interest" name="interest" value={form.interest}
            onChange={(e) => set("interest", e.target.value)} className="rounded border px-3 py-2" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="f-message">{t("apply.message")}</label>
          <textarea id="f-message" name="message" rows={3} value={form.message}
            onChange={(e) => set("message", e.target.value)} className="rounded border px-3 py-2" />
        </div>

        <div className="mt-1 flex items-start gap-2">
          <input id="f-consent" type="checkbox" checked={consent} aria-required="true"
            onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
          <label htmlFor="f-consent" className="text-gray-600">{t("apply.consent")}</label>
        </div>

        {error && <p className="text-red-600" role="alert">{error}</p>}

        <button type="submit" disabled={state === "saving"}
          className="mt-2 rounded bg-black py-3 text-white disabled:opacity-50">
          {state === "saving" ? t("apply.submitting") : t("apply.submit")}
        </button>
      </form>
    </div>
  );
}

export default function ApplyPage() {
  return <Suspense><ApplyForm /></Suspense>;
}
